/**
 * api.js : Places Data Provider & Geocoding for Terserah
 * Loads scraped Google Maps data offline from assets/data/places.json
 * 100% Client-side & GitHub Pages ready without requiring an API key
 */

import { haversineKm } from './filter.js';

export const CATEGORY_LABELS = {
  hangout:       { emoji: '☕', label: 'Nongkrong' },
  food:          { emoji: '🍜', label: 'Makan' },
  snack:         { emoji: '🥟', label: 'Jajan' },
  entertainment: { emoji: '🎮', label: 'Hiburan' },
  nature:        { emoji: '🌿', label: 'Alam' },
  shopping:      { emoji: '🛍️', label: 'Belanja' },
  culture:       { emoji: '🎨', label: 'Budaya' },
  fitness:       { emoji: '🏋️', label: 'Olahraga' },
  spiritual:     { emoji: '🕌', label: 'Religi' },
};

export const BUDGET_LABELS = {
  cheap:    { label: 'Hemat', range: '< Rp 30.000', icon: '🪙', priceLevel: 1 },
  moderate: { label: 'Sedang', range: 'Rp 30.000 - 100.000', icon: '💵', priceLevel: 2 },
  pricey:   { label: 'Agak Mahal', range: 'Rp 100.000 - 300.000', icon: '💳', priceLevel: 3 },
  luxury:   { label: 'Mewah', range: '> Rp 300.000', icon: '💎', priceLevel: 4 },
};

// In-memory cache for offline scraped places
let placesCache = null;

/**
 * Load offline scraped Google Maps dataset
 */
export async function loadOfflinePlaces(forceReload = false) {
  // 1. If global window.TERSERAH_PLACES is available (e.g. file:/// protocol)
  if (typeof window !== 'undefined' && window.TERSERAH_PLACES && Array.isArray(window.TERSERAH_PLACES) && window.TERSERAH_PLACES.length > 0 && !forceReload) {
    placesCache = window.TERSERAH_PLACES;
    return placesCache;
  }

  if (placesCache && !forceReload) {
    return placesCache;
  }

  // 2. Fetch for HTTP/HTTPS server or GitHub Pages
  try {
    const res = await fetch('assets/data/places.json?v=' + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        placesCache = data;
        return placesCache;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat assets/data/places.json via fetch:', err);
  }

  placesCache = (typeof window !== 'undefined' && window.TERSERAH_PLACES) || placesCache || [];
  return placesCache;
}

/**
 * Get statistics of the loaded places database
 */
export async function getDatabaseStats() {
  const places = await loadOfflinePlaces();
  const categoryCounts = {};
  places.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });
  return {
    total: places.length,
    categoryCounts,
  };
}

/**
 * Fetch and filter places based on location and criteria
 */
export async function fetchPlaces({ categories = ['hangout'], lat, lon, radiusKm = 5, foodQuery = '' }) {
  const allPlaces = await loadOfflinePlaces();

  if (!allPlaces || allPlaces.length === 0) {
    return [];
  }

  const queryTerms = (foodQuery || '')
    .toLowerCase()
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  // 1. Calculate distance & filter candidates
  const candidates = allPlaces
    .map(p => {
      const distance = haversineKm(lat, lon, p.lat, p.lon);
      return { ...p, distance };
    })
    .filter(p => {
      // Category filter (if category is selected)
      if (categories && categories.length > 0 && !categories.includes(p.category)) {
        return false;
      }

      // Keyword / Food / Atmosphere filter
      if (queryTerms.length > 0) {
        const textTarget = `${p.name} ${p.address} ${(p.tags || []).join(' ')} ${p.category}`.toLowerCase();
        const matchesAny = queryTerms.some(term => textTarget.includes(term));
        if (!matchesAny) return false;
      }

      return true;
    });

  // 2. Separate places within radius vs farther away
  const withinRadius = candidates.filter(p => p.distance <= radiusKm * 1.5);

  if (withinRadius.length > 0) {
    return withinRadius.sort((a, b) => a.distance - b.distance);
  }

  // Fallback: If no places strictly in radius, provide nearest places in dataset
  // so user always gets actionable recommendations
  return candidates.sort((a, b) => a.distance - b.distance).slice(0, 10);
}

/**
 * Geocode text address or city name using OpenStreetMap Nominatim
 */
export async function geocodeAddress(query) {
  if (!query || !query.trim()) return null;

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'TerserahApp/1.0',
      },
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        displayName: data[0].display_name,
      };
    }
  } catch (err) {
    console.warn('Geocoding error:', err);
  }

  // Fallback: Check if matches any place in our local dataset
  const places = await loadOfflinePlaces();
  const qLower = query.toLowerCase();
  const found = places.find(p => p.address.toLowerCase().includes(qLower) || p.name.toLowerCase().includes(qLower));
  if (found) {
    return {
      lat: found.lat,
      lon: found.lon,
      displayName: found.address,
    };
  }

  return null;
}

/**
 * Reverse geocode lat/lon to friendly address name
 */
export async function reverseGeocodeLatLng(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'id,en',
        'User-Agent': 'TerserahApp/1.0',
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch {
    // fallback
  }

  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
