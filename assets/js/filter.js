/**
 * filter.js : Filter and scoring logic for Google Places data
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

export function filterPlaces(places, filters, userLat, userLon) {
  const { minRating = 1.0, budget = 'any', radiusKm = 5 } = filters;

  const candidates = places
    .map((place) => {
      const distance = haversineKm(userLat, userLon, place.lat, place.lon);
      return { ...place, distance };
    })
    .filter((place) => {
      // 1. Radius filter with small leeway
      if (place.distance > radiusKm * 1.3) return false;

      // 2. Rating filter
      if (minRating > 1.0 && place.rating < (minRating - 0.2)) return false;

      // 3. Budget filter
      if (budget !== 'any' && place.budgetTier && place.budgetTier !== budget) return false;

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
