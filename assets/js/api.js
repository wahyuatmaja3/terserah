/**
 * api.js : OpenStreetMap API integration for Terserah
 * Primary: Overpass API
 * Fallback: Photon (Komoot OpenStreetMap) + Nominatim (OSM)
 */

export const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

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
  ],
  nature: [
    { leisure: 'park' },
    { leisure: 'garden' },
    { natural: 'beach' },
    { tourism: 'viewpoint' },
    { natural: 'waterfall' },
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

// Search keywords per category for Photon OSM search
const CATEGORY_SEARCH_TERMS = {
  hangout:       ['cafe', 'coffee', 'bar', 'nongkrong'],
  food:          ['restaurant', 'makan', 'warung', 'bakery', 'kuliner'],
  entertainment: ['cinema', 'bioskop', 'arcade', 'karaoke', 'hiburan'],
  nature:        ['taman', 'park', 'pantai', 'viewpoint', 'alam'],
  shopping:      ['mall', 'plaza', 'pasar', 'supermarket'],
  culture:       ['museum', 'galeri', 'monumen', 'budaya'],
  fitness:       ['gym', 'fitness', 'kolam renang', 'olahraga'],
  spiritual:     ['masjid', 'gereja', 'pura', 'vihara'],
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

export const BUDGET_LABELS = {
  cheap:    { label: 'Hemat', range: '< Rp 30.000', icon: '🪙' },
  moderate: { label: 'Sedang', range: 'Rp 30.000 - 100.000', icon: '💵' },
  pricey:   { label: 'Agak Mahal', range: 'Rp 100.000 - 300.000', icon: '💳' },
  luxury:   { label: 'Mewah', range: '> Rp 300.000', icon: '💎' },
};

/**
 * Build Overpass QL query
 */
function buildOverpassQuery(categories, lat, lon, radiusMeters) {
  const tags = categories.flatMap(cat => CATEGORY_TAGS[cat] || []);
  if (tags.length === 0) return null;

  const conditions = tags.map(tagObj => {
    const [key, value] = Object.entries(tagObj)[0];
    return `
      node["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
      way["${key}"="${value}"](around:${radiusMeters},${lat},${lon});
    `;
  }).join('\n');

  return `[out:json][timeout:10];(${conditions});out center tags 40;`;
}

/**
 * Estimate budget tier based on tags and category
 */
function estimateBudgetTier(category, tags = {}) {
  const priceLevel = tags.price_level || tags['check_date:price_level'];
  if (priceLevel === '1' || priceLevel === '$') return 'cheap';
  if (priceLevel === '2' || priceLevel === '$$') return 'moderate';
  if (priceLevel === '3' || priceLevel === '$$$') return 'pricey';
  if (priceLevel === '4' || priceLevel === '$$$$') return 'luxury';

  const name = (tags.name || '').toLowerCase();
  if (name.includes('warung') || name.includes('street') || name.includes('angkringan') || name.includes('mie ayam') || name.includes('bakso')) {
    return 'cheap';
  }
  if (category === 'shopping' || category === 'entertainment') {
    return 'moderate';
  }
  if (category === 'nature' || category === 'spiritual') {
    return 'cheap';
  }
  if (category === 'culture') {
    return 'cheap';
  }
  return 'moderate';
}

/**
 * Estimate rating (OSM usually doesn't have Google-like ratings, so we synthesize a quality score based on metadata or plausible range)
 */
function estimateRating(tags = {}) {
  let score = 3.8;
  if (tags.stars) score = parseFloat(tags.stars);
  else if (tags.website) score += 0.4;
  else if (tags.phone) score += 0.2;
  else if (tags.opening_hours) score += 0.3;

  // Add small deterministic variance based on name length
  const hash = (tags.name || 'place').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const variance = ((hash % 10) - 4) * 0.1;
  const finalRating = Math.min(5.0, Math.max(3.0, score + variance));
  return parseFloat(finalRating.toFixed(1));
}

/**
 * Parse raw Overpass element
 */
function parseOverpassElement(el, categories) {
  const tags = el.tags || {};
  const lat = el.lat ?? el.center?.lat;
  const lon = el.lon ?? el.center?.lon;
  if (!lat || !lon) return null;

  let detectedCategory = categories[0];
  outer: for (const cat of categories) {
    for (const tagObj of (CATEGORY_TAGS[cat] || [])) {
      const [k, v] = Object.entries(tagObj)[0];
      if (tags[k] === v) { detectedCategory = cat; break outer; }
    }
  }

  const name = tags.name || tags['name:id'] || tags['name:en'];
  if (!name || name === 'Tanpa Nama') return null;

  const addrParts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
  ].filter(Boolean);
  const address = addrParts.length > 0 ? addrParts.join(', ') : (tags.description || 'Alamat tidak tersedia');

  const extraTags = [];
  if (tags.cuisine) extraTags.push(...tags.cuisine.split(';').map(s => s.trim()));
  if (tags.wheelchair === 'yes') extraTags.push('♿ Difabel OK');
  if (tags.outdoor_seating === 'yes') extraTags.push('🌿 Outdoor');
  if (tags.internet_access === 'wlan' || tags.wifi === 'yes') extraTags.push('📶 WiFi');
  if (tags.takeaway === 'yes') extraTags.push('🛍️ Takeaway');
  if (tags.parking === 'yes' || tags['parking:fee'] !== undefined) extraTags.push('🅿️ Parkir');

  return {
    id: `osm/${el.type}/${el.id}`,
    name,
    lat,
    lon,
    category: detectedCategory,
    address,
    openingHours: tags.opening_hours || null,
    rating: estimateRating(tags),
    budgetTier: estimateBudgetTier(detectedCategory, tags),
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    tags: extraTags,
    osmTags: tags,
  };
}

/**
 * Fetch from Overpass API (tries multiple mirror endpoints)
 */
async function fetchFromOverpass(query) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'Accept': 'application/json',
        },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      if (resp.ok) {
        const json = await resp.json();
        if (json.elements && json.elements.length > 0) {
          return json.elements;
        }
      }
    } catch {
      // Endpoint error or timeout, continue to next
    }
  }
  return null;
}

/**
 * Fallback: Fetch from Photon API (Komoot OpenStreetMap search)
 */
async function fetchFromPhoton(categories, lat, lon) {
  const results = [];
  const terms = categories.flatMap(cat => CATEGORY_SEARCH_TERMS[cat] || ['place']);
  const uniqueTerms = [...new Set(terms)].slice(0, 3); // top 3 terms

  for (const term of uniqueTerms) {
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(term)}&lat=${lat}&lon=${lon}&limit=15`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!resp.ok) continue;

      const data = await resp.json();
      const features = data.features || [];

      for (const feat of features) {
        const props = feat.properties || {};
        const coords = feat.geometry?.coordinates;
        if (!coords || !props.name) continue;

        const pLon = coords[0];
        const pLat = coords[1];

        // Match category
        let cat = categories[0];
        const osmValue = (props.osm_value || '').toLowerCase();
        for (const c of categories) {
          if (CATEGORY_SEARCH_TERMS[c]?.some(k => osmValue.includes(k) || props.name.toLowerCase().includes(k))) {
            cat = c;
            break;
          }
        }

        const addrParts = [
          props.street,
          props.housenumber,
          props.district,
          props.city,
          props.state,
        ].filter(Boolean);

        const tags = [];
        if (props.osm_value) tags.push(props.osm_value);
        if (props.city) tags.push(props.city);

        results.push({
          id: `photon/${props.osm_type || 'N'}/${props.osm_id || Math.random()}`,
          name: props.name,
          lat: pLat,
          lon: pLon,
          category: cat,
          address: addrParts.length > 0 ? addrParts.join(', ') : 'Sekitar lokasi',
          openingHours: null,
          rating: estimateRating(props),
          budgetTier: estimateBudgetTier(cat, props),
          phone: null,
          website: null,
          tags,
          osmTags: props,
        });
      }
    } catch {
      // Continue next term
    }
  }

  return results;
}

/**
 * Main function: Fetch places with automatic fallback
 */
export async function fetchPlaces({ categories, lat, lon, radiusKm }) {
  const radiusMeters = radiusKm * 1000;
  const overpassQuery = buildOverpassQuery(categories, lat, lon, radiusMeters);

  // 1. Try Overpass first
  if (overpassQuery) {
    try {
      const elements = await fetchFromOverpass(overpassQuery);
      if (elements && elements.length > 0) {
        const places = elements
          .map(el => parseOverpassElement(el, categories))
          .filter(Boolean);
        if (places.length > 0) return places;
      }
    } catch (e) {
      console.warn('Overpass unavailable, switching to OSM Photon fallback:', e);
    }
  }

  // 2. Fallback to Photon OpenStreetMap API
  console.info('Fetching from OpenStreetMap Photon API...');
  const photonPlaces = await fetchFromPhoton(categories, lat, lon);
  if (photonPlaces && photonPlaces.length > 0) {
    return photonPlaces;
  }

  return [];
}

/**
 * Reverse-geocode lat/lon to area name via Nominatim
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`;
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'id', 'User-Agent': 'TerserahApp/1.0' },
      signal: AbortSignal.timeout(6000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const addr = data.address || {};
    return addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city || addr.county || data.display_name?.split(',')[0];
  } catch {
    return null;
  }
}

/**
 * Search city / area coordinates via Nominatim
 */
export async function searchLocation(query) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&accept-language=id`;
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'id', 'User-Agent': 'TerserahApp/1.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
    return null;
  } catch {
    return null;
  }
}
