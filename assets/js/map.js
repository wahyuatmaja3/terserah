/**
 * map.js — Leaflet map controller for Terserah
 * Uses OpenStreetMap tiles
 */

let map = null;
let userMarker = null;
let radiusCircle = null;
let resultMarker = null;
let poolLayerGroup = null;
let onMapClickCallback = null;

// Lazy icon creators to avoid ReferenceError if Leaflet is loading
function getUserIcon() {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
      ">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(108, 99, 255, 0.35);
          animation: pulse 1.8s ease-out infinite;
        "></div>
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #6C63FF;
          border: 3px solid #ffffff;
          box-shadow: 0 3px 10px rgba(108, 99, 255, 0.6);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function getResultIcon() {
  return L.divIcon({
    className: 'custom-result-marker',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FF6584, #f43f5e);
        border: 3px solid #ffffff;
        box-shadow: 0 4px 16px rgba(244, 63, 94, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        color: #fff;
        transform: translateY(-8px);
      ">🎯</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function getPoolPinIcon(emoji = '📍') {
  return L.divIcon({
    className: 'custom-pool-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: #ffffff;
        border: 2px solid #6C63FF;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.15s;
      ">${emoji}</div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Initialize the Leaflet map with OpenStreetMap tiles
 */
export function initMap(onMapClick) {
  if (typeof L === 'undefined') {
    console.error('Leaflet library is not loaded');
    return null;
  }

  onMapClickCallback = onMapClick;

  map = L.map('map', {
    center: [-6.2088, 106.8456], // Jakarta default
    zoom: 13,
    zoomControl: true,
    attributionControl: true,
  });

  // Official OpenStreetMap tile layer
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
  }).addTo(map);

  poolLayerGroup = L.layerGroup().addTo(map);

  // Map click handler to set user location
  map.on('click', (e) => {
    if (onMapClickCallback) {
      onMapClickCallback(e.latlng.lat, e.latlng.lng);
    }
  });

  // Ensure map tiles calculate dimensions properly
  setTimeout(() => {
    map.invalidateSize();
  }, 150);

  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
  });

  return map;
}

/**
 * Invalidate map size manually
 */
export function refreshMapSize() {
  if (map) {
    map.invalidateSize();
  }
}

/**
 * Update user location pin and radius circle
 */
export function setUserLocation(lat, lon, radiusKm) {
  if (!map) return;

  if (userMarker) userMarker.remove();
  if (radiusCircle) radiusCircle.remove();

  userMarker = L.marker([lat, lon], {
    icon: getUserIcon(),
    zIndexOffset: 1000,
  })
    .addTo(map)
    .bindPopup('<div class="popup-name">📌 Lokasimu</div><div class="popup-sub">Klik di mana saja di peta untuk pindah lokasi</div>');

  radiusCircle = L.circle([lat, lon], {
    radius: radiusKm * 1000,
    color: '#6C63FF',
    fillColor: '#6C63FF',
    fillOpacity: 0.08,
    weight: 2,
    dashArray: '6, 6',
  }).addTo(map);

  map.setView([lat, lon], getZoomForRadius(radiusKm));
  map.invalidateSize();
}

/**
 * Update radius circle only
 */
export function updateRadius(radiusKm) {
  if (radiusCircle) {
    radiusCircle.setRadius(radiusKm * 1000);
    if (userMarker) {
      const latlng = userMarker.getLatLng();
      map.setView(latlng, getZoomForRadius(radiusKm));
    }
  }
}

/**
 * Show the picked result on the map
 */
export function showResultOnMap(place) {
  if (!map) return;
  if (resultMarker) resultMarker.remove();

  resultMarker = L.marker([place.lat, place.lon], {
    icon: getResultIcon(),
    zIndexOffset: 2000,
  })
    .addTo(map)
    .bindPopup(`
      <div class="popup-name">${escapeHtml(place.name)}</div>
      <div class="popup-sub">${place.distance != null ? place.distance.toFixed(1) + ' km dari kamu' : ''}</div>
    `)
    .openPopup();

  map.flyTo([place.lat, place.lon], 16, { duration: 1.2, easeLinearity: 0.3 });
}

/**
 * Clear result marker
 */
export function clearResultMarker() {
  if (resultMarker) {
    resultMarker.remove();
    resultMarker = null;
  }
}

/**
 * Render all candidate places as markers in the pool
 */
export function renderPoolPins(places, onPlaceClick, categoryEmojis = {}) {
  if (!poolLayerGroup) return;
  poolLayerGroup.clearLayers();

  if (!places || places.length === 0) return;

  places.forEach((place) => {
    const emoji = categoryEmojis[place.category]?.emoji || '📍';
    const marker = L.marker([place.lat, place.lon], {
      icon: getPoolPinIcon(emoji),
      zIndexOffset: 500,
    });

    marker.bindPopup(`
      <div style="min-width: 140px;">
        <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 2px;">${escapeHtml(place.name)}</div>
        <div style="font-size: 0.78rem; color: #6b7280; margin-bottom: 6px;">${place.distance ? place.distance.toFixed(1) + ' km' : ''}</div>
        <button class="btn-popup-select" style="
          width: 100%;
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          background: #6C63FF;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
        ">Lihat Detail 🎲</button>
      </div>
    `);

    marker.on('popupopen', () => {
      const btn = document.querySelector('.btn-popup-select');
      if (btn) {
        btn.onclick = () => {
          if (onPlaceClick) onPlaceClick(place);
        };
      }
    });

    poolLayerGroup.addLayer(marker);
  });
}

/**
 * Clear pool pins
 */
export function clearPoolPins() {
  if (poolLayerGroup) {
    poolLayerGroup.clearLayers();
  }
}

function getZoomForRadius(km) {
  if (km <= 1.5) return 15;
  if (km <= 3) return 14;
  if (km <= 6) return 13;
  if (km <= 12) return 12;
  if (km <= 20) return 11;
  return 10;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export { map };
