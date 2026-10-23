/**
 * map.js — Leaflet map controller for Terserah
 */

let map = null;
let userMarker = null;
let radiusCircle = null;
let resultMarker = null;
let poolMarkers = [];

const USER_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:20px; height:20px; border-radius:50%;
    background:#6C63FF; border:3px solid #fff;
    box-shadow:0 2px 8px rgba(108,99,255,0.5);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const RESULT_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width:36px; height:36px; border-radius:50%;
    background:#FF6584; border:3px solid #fff;
    box-shadow:0 4px 16px rgba(255,101,132,0.55);
    display:flex; align-items:center; justify-content:center;
    font-size:18px; line-height:1;
  ">📍</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

/**
 * Initialize the Leaflet map
 */
export function initMap() {
  map = L.map('map', {
    center: [-6.2088, 106.8456], // Jakarta default
    zoom: 13,
    zoomControl: true,
    attributionControl: false,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors',
  }).addTo(map);

  // Small attribution
  L.control.attribution({ position: 'bottomleft', prefix: false })
    .addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a>')
    .addTo(map);

  return map;
}

/**
 * Update user location pin and radius circle
 */
export function setUserLocation(lat, lon, radiusKm) {
  if (userMarker) userMarker.remove();
  if (radiusCircle) radiusCircle.remove();

  userMarker = L.marker([lat, lon], { icon: USER_ICON, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup('<div class="popup-name">📌 Lokasiku</div>');

  radiusCircle = L.circle([lat, lon], {
    radius: radiusKm * 1000,
    color: '#6C63FF',
    fillColor: '#6C63FF',
    fillOpacity: 0.06,
    weight: 1.5,
    dashArray: '6 4',
  }).addTo(map);

  map.setView([lat, lon], getZoomForRadius(radiusKm));
}

/**
 * Update radius circle only
 */
export function updateRadius(radiusKm) {
  if (radiusCircle) {
    radiusCircle.setRadius(radiusKm * 1000);
  }
}

/**
 * Show the picked result on the map
 */
export function showResultOnMap(place) {
  if (resultMarker) resultMarker.remove();

  resultMarker = L.marker([place.lat, place.lon], { icon: RESULT_ICON, zIndexOffset: 999 })
    .addTo(map)
    .bindPopup(`
      <div class="popup-name">${escapeHtml(place.name)}</div>
      <div class="popup-sub">${place.distance?.toFixed(1)} km dari kamu</div>
    `)
    .openPopup();

  map.flyTo([place.lat, place.lon], 16, { duration: 1.2, easeLinearity: 0.3 });
}

/**
 * Clear result marker
 */
export function clearResultMarker() {
  if (resultMarker) { resultMarker.remove(); resultMarker = null; }
}

/**
 * Utility zoom level based on radius
 */
function getZoomForRadius(km) {
  if (km <= 1)  return 16;
  if (km <= 3)  return 14;
  if (km <= 5)  return 13;
  if (km <= 10) return 12;
  if (km <= 20) return 11;
  return 10;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

export { map };
