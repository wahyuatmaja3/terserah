/**
 * map.js : Leaflet map controller for Terserah
 * Uses OpenStreetMap tiles with custom anti-slop visual theme
 */

let map = null;
let userMarker = null;
let radiusCircle = null;
let resultMarker = null;
let poolLayerGroup = null;
let onMapClickCallback = null;

// User location marker
function getUserIcon() {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div style="position: relative; width: 22px; height: 22px;">
        <div style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background: rgba(249, 115, 22, 0.3);
          animation: pulseMarker 1.8s ease-out infinite;
        "></div>
        <div style="
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f97316;
          border: 3px solid #090a0f;
          box-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Result target marker
function getResultIcon() {
  return L.divIcon({
    className: 'custom-result-marker',
    html: `
      <div style="
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: #090a0f;
        border: 2px solid #f97316;
        box-shadow: 0 8px 24px rgba(249, 115, 22, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        transform: translateY(-8px);
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">🎲</div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

// Small pins for candidate pool
function getPoolPinIcon(emoji = '📍') {
  return L.divIcon({
    className: 'custom-pool-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: #141721;
        border: 1.5px solid #2b2f3d;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        cursor: pointer;
        transition: transform 0.15s, border-color 0.15s;
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
    center: [-6.2088, 106.8456],
    zoom: 13,
    zoomControl: true,
    attributionControl: true,
  });

  // Official OpenStreetMap tile layer
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> kontributor',
  }).addTo(map);

  poolLayerGroup = L.layerGroup().addTo(map);

  map.on('click', (e) => {
    if (onMapClickCallback) {
      onMapClickCallback(e.latlng.lat, e.latlng.lng);
    }
  });

  setTimeout(() => {
    if (map) map.invalidateSize();
  }, 200);

  window.addEventListener('resize', () => {
    if (map) map.invalidateSize();
  });

  return map;
}

export function refreshMapSize() {
  if (map) {
    map.invalidateSize();
  }
}

export function setUserLocation(lat, lon, radiusKm) {
  if (!map) return;

  if (userMarker) userMarker.remove();
  if (radiusCircle) radiusCircle.remove();

  userMarker = L.marker([lat, lon], {
    icon: getUserIcon(),
    zIndexOffset: 1000,
  })
    .addTo(map)
    .bindPopup('<div class="popup-title">Lokasimu</div><div class="popup-desc">Klik di mana saja pada peta untuk geser titik acuan</div>');

  radiusCircle = L.circle([lat, lon], {
    radius: radiusKm * 1000,
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.07,
    weight: 1.5,
    dashArray: '5, 5',
  }).addTo(map);

  map.setView([lat, lon], getZoomForRadius(radiusKm));
  map.invalidateSize();
}

export function updateRadius(radiusKm) {
  if (radiusCircle) {
    radiusCircle.setRadius(radiusKm * 1000);
    if (userMarker) {
      const latlng = userMarker.getLatLng();
      map.setView(latlng, getZoomForRadius(radiusKm));
    }
  }
}

export function showResultOnMap(place) {
  if (!map) return;
  if (resultMarker) resultMarker.remove();

  resultMarker = L.marker([place.lat, place.lon], {
    icon: getResultIcon(),
    zIndexOffset: 2000,
  })
    .addTo(map)
    .bindPopup(`
      <div class="popup-title">${escapeHtml(place.name)}</div>
      <div class="popup-desc">${place.distance != null ? place.distance.toFixed(1) + ' km dari kamu' : ''}</div>
    `)
    .openPopup();

  map.flyTo([place.lat, place.lon], 16, { duration: 1.2, easeLinearity: 0.3 });
}

export function clearResultMarker() {
  if (resultMarker) {
    resultMarker.remove();
    resultMarker = null;
  }
}

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
      <div style="min-width: 140px; padding: 2px;">
        <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px; color: #f8fafc;">${escapeHtml(place.name)}</div>
        <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">${place.distance ? place.distance.toFixed(1) + ' km' : ''}</div>
        <button class="btn-popup-view" style="
          width: 100%;
          padding: 5px 8px;
          border-radius: 6px;
          border: 1px solid #f97316;
          background: #f97316;
          color: #090a0f;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        ">Lihat Tempat</button>
      </div>
    `);

    marker.on('popupopen', () => {
      const btn = document.querySelector('.btn-popup-view');
      if (btn) {
        btn.onclick = () => {
          if (onPlaceClick) onPlaceClick(place);
        };
      }
    });

    poolLayerGroup.addLayer(marker);
  });
}

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
