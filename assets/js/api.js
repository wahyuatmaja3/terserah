/**
 * api.js : Google Maps JavaScript API & Google Places Service for Terserah
 * Exclusively uses Google Places API & Google Geocoding (no OpenStreetMap)
 */

export const CATEGORY_GOOGLE_TYPES = {
  hangout:       ['cafe', 'bar'],
  food:          ['restaurant', 'bakery', 'meal_takeaway'],
  entertainment: ['movie_theater', 'bowling_alley', 'amusement_park', 'night_club'],
  nature:        ['park', 'tourist_attraction', 'campground'],
  shopping:      ['shopping_mall', 'department_store', 'supermarket'],
  culture:       ['museum', 'art_gallery'],
  fitness:       ['gym', 'stadium'],
  spiritual:     ['mosque', 'church', 'place_of_worship', 'hindu_temple'],
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
  cheap:    { label: 'Hemat', range: '< Rp 30.000', icon: '🪙', priceLevel: 1 },
  moderate: { label: 'Sedang', range: 'Rp 30.000 - 100.000', icon: '💵', priceLevel: 2 },
  pricey:   { label: 'Agak Mahal', range: 'Rp 100.000 - 300.000', icon: '💳', priceLevel: 3 },
  luxury:   { label: 'Mewah', range: '> Rp 300.000', icon: '💎', priceLevel: 4 },
};

let placesService = null;
let geocoder = null;

/**
 * Dynamically load Google Maps JavaScript API SDK
 */
export function loadGoogleMapsSDK(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps && window.google.maps.places) {
      resolve(window.google.maps);
      return;
    }

    const existing = document.getElementById('google-maps-sdk');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'google-maps-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&language=id`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps SDK gagal diinisialisasi.'));
      }
    };

    script.onerror = () => {
      reject(new Error('Gagal memuat Google Maps SDK. Pastikan API key valid.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Initialize Places Service and Geocoder
 */
export function initServices(mapInstance) {
  if (!window.google || !window.google.maps) return;
  placesService = new google.maps.places.PlacesService(mapInstance);
  geocoder = new google.maps.Geocoder();
}

/**
 * Convert Google price_level (0-4) to internal budgetTier
 */
function getBudgetTierFromPriceLevel(priceLevel, category = 'food') {
  if (priceLevel === 1) return 'cheap';
  if (priceLevel === 2) return 'moderate';
  if (priceLevel === 3) return 'pricey';
  if (priceLevel === 4) return 'luxury';
  if (category === 'nature' || category === 'spiritual') return 'cheap';
  return 'moderate';
}

/**
 * Parse Google Places result object into unified place schema
 */
function normalizeGooglePlace(place, category = 'food') {
  const loc = place.geometry?.location;
  if (!loc) return null;

  const lat = typeof loc.lat === 'function' ? loc.lat() : loc.lat;
  const lon = typeof loc.lng === 'function' ? loc.lng() : loc.lng;

  let photoUrl = null;
  if (place.photos && place.photos.length > 0) {
    try {
      photoUrl = place.photos[0].getUrl({ maxWidth: 640, maxHeight: 400 });
    } catch {
      photoUrl = null;
    }
  }

  const budgetTier = getBudgetTierFromPriceLevel(place.price_level, category);

  const tags = [];
  if (place.user_ratings_total) {
    tags.push(`${place.user_ratings_total.toLocaleString('id-ID')} ulasan`);
  }
  if (place.types && place.types.length > 0) {
    const usefulTypes = place.types
      .filter(t => !['point_of_interest', 'establishment'].includes(t))
      .slice(0, 3)
      .map(t => t.replace(/_/g, ' '));
    tags.push(...usefulTypes);
  }

  return {
    id: `gmaps/${place.place_id || Math.random()}`,
    placeId: place.place_id,
    name: place.name || 'Tempat Tanpa Nama',
    lat,
    lon,
    category,
    address: place.vicinity || place.formatted_address || 'Area sekitar',
    rating: place.rating || 4.2,
    ratingsCount: place.user_ratings_total || null,
    budgetTier,
    priceLevel: place.price_level ?? null,
    photoUrl,
    isOpen: place.opening_hours ? (place.opening_hours.isOpen ? place.opening_hours.isOpen() : place.opening_hours.open_now) : null,
    tags,
    googleData: place,
  };
}

/**
 * Fetch places using Google Maps PlacesService
 */
export async function fetchPlacesViaGoogle({ categories, lat, lon, radiusKm, foodQuery = '' }) {
  if (!placesService) {
    throw new Error('PlacesService belum siap. Muat Google Maps terlebih dahulu.');
  }

  const radiusMeters = radiusKm * 1000;
  const location = new google.maps.LatLng(lat, lon);
  const placesMap = new Map();

  const primaryCategory = categories[0] || 'food';

  // 1. If user typed a food query (e.g. "matcha", "sushi", "dimsum")
  if (foodQuery && foodQuery.trim()) {
    const keywords = foodQuery.split(',').map(s => s.trim()).filter(Boolean);
    for (const kw of keywords) {
      await new Promise((resolve) => {
        placesService.textSearch(
          {
            location,
            radius: radiusMeters,
            query: `${kw} di sekitar`,
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
              results.forEach((p) => {
                const norm = normalizeGooglePlace(p, primaryCategory);
                if (norm) {
                  norm.tags.unshift(`Menu: ${kw}`);
                  placesMap.set(norm.id, norm);
                }
              });
            }
            resolve();
          }
        );
      });
    }
  }

  // 2. Fetch nearby places based on categories
  const typesToQuery = [];
  categories.forEach((cat) => {
    const types = CATEGORY_GOOGLE_TYPES[cat] || ['restaurant'];
    typesToQuery.push({ cat, type: types[0] });
  });

  for (const item of typesToQuery.slice(0, 3)) {
    await new Promise((resolve) => {
      placesService.nearbySearch(
        {
          location,
          radius: radiusMeters,
          type: item.type,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((p) => {
              const norm = normalizeGooglePlace(p, item.cat);
              if (norm && !placesMap.has(norm.id)) {
                placesMap.set(norm.id, norm);
              }
            });
          }
          resolve();
        }
      );
    });
  }

  return Array.from(placesMap.values());
}

/**
 * Geocode text/city address to coordinates using Google Geocoder
 */
export function geocodeAddress(query) {
  return new Promise((resolve, reject) => {
    if (!geocoder) {
      if (window.google && window.google.maps) {
        geocoder = new google.maps.Geocoder();
      } else {
        reject(new Error('Geocoder belum diinisialisasi.'));
        return;
      }
    }

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const item = results[0];
        const lat = item.geometry.location.lat();
        const lon = item.geometry.location.lng();
        resolve({
          lat,
          lon,
          displayName: item.formatted_address,
        });
      } else {
        resolve(null);
      }
    });
  });
}

/**
 * Reverse geocode lat/lon to human readable address using Google Geocoder
 */
export function reverseGeocodeLatLng(lat, lon) {
  return new Promise((resolve) => {
    if (!geocoder) {
      if (window.google && window.google.maps) {
        geocoder = new google.maps.Geocoder();
      } else {
        resolve(null);
        return;
      }
    }

    geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
        const item = results[0];
        // Shorten address for clean UI
        const parts = item.formatted_address.split(',');
        const shortName = parts.slice(0, 2).join(',').trim();
        resolve(shortName || item.formatted_address);
      } else {
        resolve(null);
      }
    });
  });
}
