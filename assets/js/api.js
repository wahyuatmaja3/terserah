/**
 * api.js — Overpass API integration for Terserah
 * Fetches places from OpenStreetMap via Overpass API
 */

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

let endpointIndex = 0;

function getEndpoint() {
  return OVERPASS_ENDPOINTS[endpointIndex % OVERPASS_ENDPOINTS.length];
}

// OSM tag mappings per category
export const CATEGORY_TAGS = {
  hangout: [
    { amenity: 'cafe' },
    { amenity: 'bar' },
    { amenity: 'pub' },
    { leisure: 'outdoor_seating' },
  ],
  food: [
    { amenity: 'restaurant' },
    { amenity: 'food_court' },
    { amenity: 'fast_food' },
    { amenity: 'ice_cream' },
    { amenity: 'bakery' },
  ],
  entertainment: [
    { amenity: 'cinema' },
    { amenity: 'theatre' },
    { amenity: 'nightclub' },
    { leisure: 'amusement_arcade' },
    { leisure: 'bowling_alley' },
    { leisure: 'escape_game' },
    { leisure: 'miniature_golf' },
  ],
  nature: [
    { leisure: 'park' },
    { leisure: 'garden' },
    { natural: 'beach' },
    { tourism: 'viewpoint' },
    { natural: 'waterfall' },
    { leisure: 'nature_reserve' },
  ],
  shopping: [
    { shop: 'mall' },
    { shop: 'supermarket' },
    { amenity: 'marketplace' },
    { shop: 'market' },
  ],
  culture: [
    { tourism: 'museum' },
    { amenity: 'arts_centre' },
    { tourism: 'gallery' },
    { tourism: 'attraction' },
    { historic: 'monument' },
  ],
  fitness: [
    { leisure: 'sports_centre' },
    { leisure: 'fitness_centre' },
    { leisure: 'swimming_pool' },
    { leisure: 'stadium' },
  ],
  spiritual: [
    { amenity: 'place_of_worship' },
  ],
};

export const CATEGORY_LABELS = {
  hangout:       { emoji: '☕', label: 'Nongkrong' },
  food:          { emoji: '🍜', label: 'Makan' },
  entertainment: { emoji: '🎮', label: 'Hiburan' },
  nature:        { emoji: '🌿', label: 'Alam' },
  shopping:      { emoji: '🛍️', label: 'Belanja' },
  culture:       { emoji: '🎨', label: 'Budaya' },
  fitness:       { emoji: '🏋️', label: 'Olahraga' },
  spiritual:     { emoji: '🕌', label: 'Religi' },
};

/**
 * Build an Overpass QL query for given categories, lat, lon, radius (meters)
 */
function buildQuery(categories, lat, lon, radiusMeters) {
  const tags = categories.flatMap(cat => CATEGORY_TAGS[cat] || []);

  if (tags.length === 0) return null;

  const conditions = tags.map(tagObj => {
    const [key, value] = Object.entries(tagObj)[0];
    return `
      node["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
      way["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
    `;
  }).join('\n');

  return `
    [out:json][timeout:25];
    (
      ${conditions}
    );
    out center tags;
  `;
}

/**
 * Parse raw Overpass element into a normalized place object
 */
function parseElement(el, categories) {
  const tags = el.tags || {};
  const lat  = el.lat  ?? el.center?.lat;
  const lon  = el.lon  ?? el.center?.lon;

  if (!lat || !lon) return null;

  // Detect which category this element belongs to
  let detectedCategory = categories[0];
  outer: for (const cat of categories) {
    for (const tagObj of (CATEGORY_TAGS[cat] || [])) {
      const [k, v] = Object.entries(tagObj)[0];
      if (tags[k] === v) { detectedCategory = cat; break outer; }
    }
  }

  const name = tags.name || tags['name:id'] || tags['name:en'] || 'Tanpa Nama';

  // Build address string
  const addrParts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
  ].filter(Boolean);
  const address = addrParts.length > 0 ? addrParts.join(', ') : (tags.description || '—');

  // Opening hours
  const openingHours = tags.opening_hours || null;

  // Extra tags for display
  const extraTags = [];
  if (tags.cuisine)     extraTags.push(...tags.cuisine.split(';').map(s => s.trim()));
  if (tags.wheelchair === 'yes') extraTags.push('Difabel OK');
  if (tags.outdoor_seating === 'yes') extraTags.push('Outdoor');
  if (tags.internet_access === 'wlan') extraTags.push('WiFi');
  if (tags.takeaway === 'yes') extraTags.push('Takeaway');

  return {
    id: `${el.type}/${el.id}`,
    name,
    lat,
    lon,
    category: detectedCategory,
    address,
    openingHours,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    tags: extraTags,
    osmTags: tags,
  };
}

/**
 * Fetch places from Overpass API
 * @param {object} params
 * @param {string[]} params.categories
 * @param {number}   params.lat
 * @param {number}   params.lon
 * @param {number}   params.radiusKm
 * @returns {Promise<object[]>}
 */
export async function fetchPlaces({ categories, lat, lon, radiusKm }) {
  const radiusMeters = radiusKm * 1000;
  const query = buildQuery(categories, lat, lon, radiusMeters);
  if (!query) return [];

  const endpoint = getEndpoint();
  const body = new URLSearchParams({ data: query });

  const resp = await fetch(endpoint, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) {
    endpointIndex++;
    throw new Error(`Overpass error ${resp.status}`);
  }

  const json = await resp.json();
  const elements = json.elements || [];

  return elements
    .map(el => parseElement(el, categories))
    .filter(Boolean);
}

/**
 * Reverse-geocode lat/lon to a human-readable name using Nominatim
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`;
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'id', 'User-Agent': 'Terserah-App/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const addr = data.address || {};
    return addr.suburb || addr.village || addr.town || addr.city || addr.county || data.display_name;
  } catch {
    return null;
  }
}
