/**
 * filter.js — Filter and scoring logic for Terserah
 */

const TIME_SLOTS = {
  morning:   [5, 11],
  noon:      [11, 14],
  afternoon: [14, 18],
  evening:   [18, 24],
  any:       [0, 24],
};

/**
 * Calculate distance in km between two lat/lon pairs (Haversine formula)
 */
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

/**
 * Check if a place is open based on OSM opening_hours string
 * Returns: 'open' | 'closed' | 'unknown'
 */
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

/**
 * Filter places by food / atmosphere query keywords (LIKE search)
 */
function matchesFoodQuery(place, query) {
  if (!query || !query.trim()) return true;

  const keywords = query.toLowerCase().split(',').map(k => k.trim()).filter(Boolean);
  const searchable = [
    place.name,
    place.address,
    ...(place.tags || []),
    place.osmTags?.cuisine || '',
    place.osmTags?.description || '',
    place.osmTags?.amenity || '',
  ].join(' ').toLowerCase();

  return keywords.some(kw => searchable.includes(kw));
}

/**
 * Filter and score pool of candidate places
 * @param {object[]} places  — raw places from API
 * @param {object}   filters — user filter values
 * @param {number}   userLat
 * @param {number}   userLon
 * @returns {object[]}
 */
export function filterPlaces(places, filters, userLat, userLon) {
  const { timeOfDay = 'any', minRating = 1.0, budget = 'any', foodQuery = '', radiusKm = 5 } = filters;
  const currentHour = new Date().getHours();

  return places
    .map(place => {
      const distance = haversineKm(userLat, userLon, place.lat, place.lon);
      const openStatus = checkOpenStatus(place.openingHours, currentHour);
      return { ...place, distance, openStatus };
    })
    .filter(place => {
      // 1. Radius filter: allow small leeway (+20%) in case candidates are slightly past circle
      if (place.distance > radiusKm * 1.25) return false;

      // 2. Rating filter
      if (minRating > 1.0 && place.rating < (minRating - 0.2)) return false;

      // 3. Budget filter
      if (budget !== 'any' && place.budgetTier && place.budgetTier !== budget) return false;

      // 4. Time filter: only filter out if explicitly closed during user slot
      if (timeOfDay !== 'any' && place.openStatus === 'closed') return false;

      // 5. Food / Keyword filter
      if (!matchesFoodQuery(place, foodQuery)) return false;

      return true;
    })
    // Deduplicate by name (keep closest)
    .reduce((acc, place) => {
      const existing = acc.find(p => p.name.toLowerCase() === place.name.toLowerCase());
      if (!existing) {
        acc.push(place);
      } else if (place.distance < existing.distance) {
        const idx = acc.indexOf(existing);
        acc[idx] = place;
      }
      return acc;
    }, [])
    // Sort primarily by distance
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Random pick algorithm from filtered pool
 */
export function pickRandom(pool, lastPickedId = null) {
  if (!pool || pool.length === 0) return null;
  if (pool.length === 1) return pool[0];

  // Try to avoid repeating the last picked place
  const candidates = pool.filter(p => p.id !== lastPickedId);
  const targetList = candidates.length > 0 ? candidates : pool;

  const idx = Math.floor(Math.random() * targetList.length);
  return targetList[idx];
}
