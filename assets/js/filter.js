/**
 * filter.js : Filter and scoring logic for Terserah
 */

const INVALID_AMENITIES = new Set([
  'hairdresser', 'pitch', 'optician', 'post_office', 'travel_agency',
  'bus_stop', 'atm', 'bank', 'pharmacy', 'fuel', 'parking', 'car_wash'
]);

const TIME_SLOTS = {
  morning:   [5, 11],
  noon:      [11, 14],
  afternoon: [14, 18],
  evening:   [18, 24],
  any:       [0, 24],
};

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function checkOpenStatus(openingHoursStr, hour) {
  if (!openingHoursStr) return 'unknown';

  const oh = openingHoursStr.toLowerCase().trim();
  if (oh === '24/7' || oh === 'mo-su 00:00-24:00') return 'open';

  const dayMap = { mo:1, tu:2, we:3, th:4, fr:5, sa:6, su:7 };
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();

  const rules = oh.split(';').map(s => s.trim());
  for (const rule of rules) {
    const m = rule.match(/([a-z,\-]+)\s+(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (!m) continue;

    const dayPart = m[1];
    const openH   = parseInt(m[2]);
    const closeH  = parseInt(m[4]);

    const days = [];
    const dayTokens = dayPart.split(',');
    for (const token of dayTokens) {
      const rangeParts = token.split('-');
      if (rangeParts.length === 2) {
        const start = dayMap[rangeParts[0]];
        const end   = dayMap[rangeParts[1]];
        if (start && end) {
          for (let d = start; d <= end; d++) days.push(d);
        }
      } else {
        if (dayMap[token]) days.push(dayMap[token]);
      }
    }

    if (days.includes(currentDay)) {
      if (hour >= openH && hour < closeH) return 'open';
      return 'closed';
    }
  }

  return 'unknown';
}

function matchesFoodQuery(place, query) {
  if (!query || !query.trim()) return true;

  const keywords = query.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);

  // Exclude non-food amenities strictly
  const osmVal = (place.osmTags?.amenity || place.osmTags?.osm_value || '').toLowerCase();
  if (INVALID_AMENITIES.has(osmVal)) return false;

  const nameLower = place.name.toLowerCase();
  if (nameLower.includes('barber') || nameLower.includes('travel') || nameLower.includes('futsal') || nameLower.includes('express')) {
    return false;
  }

  // 1. Direct match with tags
  if (place.tags && place.tags.some(t => {
    const lowerTag = t.toLowerCase();
    return keywords.some(k => lowerTag.includes(k));
  })) {
    return true;
  }

  // 2. Direct match with name / cuisine / address
  const searchable = [
    place.name,
    place.address,
    ...(place.tags || []),
    place.osmTags?.cuisine || '',
    place.osmTags?.description || '',
    place.osmTags?.amenity || '',
  ].join(' ').toLowerCase();

  if (keywords.some(kw => searchable.includes(kw))) {
    return true;
  }

  // 3. If user searches cafe/beverage items (matcha, coffee, latte, tea, etc.)
  // and the place is genuinely a cafe or bakery
  const cafeBeverages = ['matcha', 'kopi', 'coffee', 'latte', 'tea', 'teh', 'croissant', 'dessert', 'waffle', 'cake', 'roti'];
  const isCafeQuery = keywords.some(k => cafeBeverages.includes(k));
  if (isCafeQuery) {
    const isGenuinelyCafe = place.osmTags?.amenity === 'cafe' ||
      place.osmTags?.amenity === 'bakery' ||
      place.osmTags?.shop === 'bakery' ||
      place.osmTags?.osm_value === 'cafe' ||
      nameLower.includes('cafe') ||
      nameLower.includes('coffee') ||
      nameLower.includes('kopi');
    if (isGenuinelyCafe) return true;
  }

  return false;
}

export function filterPlaces(places, filters, userLat, userLon) {
  const { timeOfDay = 'any', minRating = 1.0, budget = 'any', foodQuery = '', radiusKm = 5 } = filters;
  const currentHour = new Date().getHours();

  const candidates = places
    .map(place => {
      const distance = haversineKm(userLat, userLon, place.lat, place.lon);
      const openStatus = checkOpenStatus(place.openingHours, currentHour);
      return { ...place, distance, openStatus };
    })
    .filter(place => {
      // 1. Filter out invalid amenities
      const osmVal = (place.osmTags?.amenity || place.osmTags?.osm_value || '').toLowerCase();
      if (INVALID_AMENITIES.has(osmVal)) return false;

      const nameLower = place.name.toLowerCase();
      if (nameLower.includes('barber') || nameLower.includes('travel') || nameLower.includes('futsal') || nameLower.includes('express')) {
        return false;
      }

      // 2. Radius filter (with 35% leeway)
      if (place.distance > radiusKm * 1.35) return false;

      // 3. Rating filter
      if (minRating > 1.0 && place.rating < (minRating - 0.25)) return false;

      // 4. Budget filter
      if (budget !== 'any' && place.budgetTier && place.budgetTier !== budget) return false;

      // 5. Time filter
      if (timeOfDay !== 'any' && place.openStatus === 'closed') return false;

      // 6. Food query filter
      if (!matchesFoodQuery(place, foodQuery)) return false;

      return true;
    })
    // Deduplicate by name
    .reduce((acc, place) => {
      const existing = acc.find(p => p.name.toLowerCase() === place.name.toLowerCase());
      if (!existing) {
        acc.push(place);
      } else if (place.distance < existing.distance) {
        const idx = acc.indexOf(existing);
        acc[idx] = place;
      }
      return acc;
    }, []);

  // If user searched a specific query, prioritize direct name/tag matches!
  const qLower = (foodQuery || '').toLowerCase().trim();
  if (qLower) {
    const directMatches = candidates.filter(p =>
      p.name.toLowerCase().includes(qLower) || p.tags?.some(t => t.toLowerCase().includes(qLower))
    );

    // If direct matches exist (like Feel Matcha), return them!
    if (directMatches.length > 0) {
      return directMatches.sort((a, b) => a.distance - b.distance);
    }
  }

  return candidates.sort((a, b) => a.distance - b.distance);
}

export function pickRandom(pool, lastPickedId = null) {
  if (!pool || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  const candidates = pool.filter(p => p.id !== lastPickedId);
  const targetList = candidates.length > 0 ? candidates : pool;

  const idx = Math.floor(Math.random() * targetList.length);
  return targetList[idx];
}
