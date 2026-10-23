/**
 * filter.js — Filter and scoring logic for Terserah
 */

import { CATEGORY_TAGS } from './api.js';

const TIME_SLOTS = {
  morning:   [5, 11],
  noon:      [11, 14],
  afternoon: [14, 18],
  evening:   [18, 24],
  any:       [0, 24],
};

/**
 * Calculate distance in km between two lat/lon pairs (Haversine)
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
 * Check if a place is open at a given hour based on OSM opening_hours
 * This is a simplified parser — covers the most common formats.
 * Returns: 'open' | 'closed' | 'unknown'
 */
export function checkOpenStatus(openingHoursStr, hour) {
  if (!openingHoursStr) return 'unknown';

  const oh = openingHoursStr.toLowerCase().trim();
  if (oh === '24/7' || oh === 'mo-su 00:00-24:00') return 'open';

  // Try to parse "Mo-Su HH:MM-HH:MM" style
  const dayMap = { mo:1, tu:2, we:3, th:4, fr:5, sa:6, su:7 };
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay(); // 1=Mon..7=Sun

  // Handle multiple rules separated by ";"
  const rules = oh.split(';').map(s => s.trim());
  for (const rule of rules) {
    // Match pattern like "mo-fr 09:00-21:00" or "sa,su 10:00-22:00"
    const m = rule.match(/([a-z,\-]+)\s+(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (!m) continue;

    const dayPart = m[1];
    const openH   = parseInt(m[2]);
    const closeH  = parseInt(m[4]);

    // Expand day ranges
    let days = [];
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
 * Filter places by food query keywords (fuzzy match on name, tags, cuisine)
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
  ].join(' ').toLowerCase();

  return keywords.some(kw => searchable.includes(kw));
}

/**
 * Filter and enrich a pool of places based on user filters
 * @param {object[]} places  — raw places from API
 * @param {object}   filters — user-selected filter values
 * @param {number}   userLat
 * @param {number}   userLon
 * @returns {object[]}       — filtered & distance-enriched places
 */
export function filterPlaces(places, filters, userLat, userLon) {
  const { timeOfDay, minRating, foodQuery } = filters;
  const [slotStart, slotEnd] = TIME_SLOTS[timeOfDay] || [0, 24];
  const currentHour = new Date().getHours();

  return places
    .map(place => {
      const distance = haversineKm(userLat, userLon, place.lat, place.lon);
      const openStatus = checkOpenStatus(place.openingHours, currentHour);
      return { ...place, distance, openStatus };
    })
    .filter(place => {
      // Time filter: only exclude if we know it's closed AND user selected a specific slot
      if (timeOfDay !== 'any' && place.openStatus === 'closed') return false;

      // Food / keyword query filter
      if (!matchesFoodQuery(place, foodQuery)) return false;

      return true;
    })
    // Deduplicate by name (keep closest)
    .reduce((acc, place) => {
      const existing = acc.find(p => p.name === place.name);
      if (!existing || place.distance < existing.distance) {
        return [...acc.filter(p => p.name !== place.name), place];
      }
      return acc;
    }, [])
    // Sort by distance for deterministic pool
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Randomly pick one place from filtered pool
 */
export function pickRandom(pool) {
  if (!pool || pool.length === 0) return null;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
