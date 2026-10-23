/**
 * map.js : Google Maps controller for Terserah
 * Replaces OpenStreetMap with Google Maps JavaScript API
 */

export const darkMapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#0f1118' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1118' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#747b90' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d1d5db' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca3af' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#131920' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b7280' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1b1f2c' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#121520' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8a94a6' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#272d40' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#171a26' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#151824' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#08090f' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
];

let gMap = null;
let userMarker = null;
let radiusCircle = null;
let resultMarker = null;
let poolMarkers = [];
let infoWindow = null;
let onMapClickCallback = null;

export function initGoogleMap(centerLat, centerLon, onMapClick) {
  if (!window.google || !window.google.maps) {
    console.error('Google Maps SDK belum dimuat.');
    return null;
  }

  onMapClickCallback = onMapClick;
  const container = document.getElementById('map');
  if (!container) return null;

  const center = { lat: centerLat, lng: centerLon };

  gMap = new google.maps.Map(container, {
    center,
    zoom: 13,
    styles: darkMapStyles,
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  infoWindow = new google.maps.InfoWindow();

  // Click on map to move user location
  gMap.addListener('click', (e) => {
    if (onMapClickCallback && e.latLng) {
      onMapClickCallback(e.latLng.lat(), e.latLng.lng());
    }
  });

  return gMap;
}

export function getGoogleMapInstance() {
  return gMap;
}

export function setUserLocation(lat, lon, radiusKm) {
  if (!gMap || !window.google) return;

  const pos = { lat, lng: lon };

  // User Marker
  if (userMarker) {
    userMarker.setPosition(pos);
  } else {
    userMarker = new google.maps.Marker({
      position: pos,
      map: gMap,
      title: 'Titik Acuan Lokasimu',
      zIndex: 1000,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 9,
        fillColor: '#f97316',
        fillOpacity: 1,
        strokeColor: '#090a0f',
        strokeWeight: 3,
      },
    });

    userMarker.addListener('click', () => {
      infoWindow.setContent(`
        <div style="padding: 6px; font-family: sans-serif; color: #12141c;">
          <strong style="font-size: 13px;">Titik Acuan Lokasimu</strong><br>
          <span style="font-size: 11px; color: #64748b;">Klik di mana saja pada peta untuk geser titik</span>
        </div>
      `);
      infoWindow.open(gMap, userMarker);
    });
  }

  // Radius Circle
  if (radiusCircle) {
    radiusCircle.setCenter(pos);
    radiusCircle.setRadius(radiusKm * 1000);
  } else {
    radiusCircle = new google.maps.Circle({
      strokeColor: '#f97316',
      strokeOpacity: 0.85,
      strokeWeight: 1.5,
      fillColor: '#f97316',
      fillOpacity: 0.08,
      map: gMap,
      center: pos,
      radius: radiusKm * 1000,
      clickable: false,
    });
  }

  gMap.setCenter(pos);
  adjustZoomForRadius(radiusKm);
}

export function updateRadius(radiusKm) {
  if (radiusCircle) {
    radiusCircle.setRadius(radiusKm * 1000);
    adjustZoomForRadius(radiusKm);
  }
}

export function showResultOnMap(place) {
  if (!gMap || !window.google) return;

  const pos = { lat: place.lat, lng: place.lon };

  if (resultMarker) {
    resultMarker.setMap(null);
  }

  resultMarker = new google.maps.Marker({
    position: pos,
    map: gMap,
    title: place.name,
    zIndex: 2000,
    animation: google.maps.Animation.DROP,
    icon: {
      path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
      fillColor: '#f97316',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.3,
    },
  });

  const contentStr = `
    <div style="padding: 6px 8px; font-family: sans-serif; color: #12141c; max-width: 220px;">
      <div style="font-weight: 700; font-size: 13px; color: #090a0f; margin-bottom: 3px;">${escapeHtml(place.name)}</div>
      <div style="font-size: 11px; color: #64748b;">${place.distance ? place.distance.toFixed(1) + ' km dari kamu' : ''}</div>
    </div>
  `;

  infoWindow.setContent(contentStr);
  infoWindow.open(gMap, resultMarker);

  gMap.panTo(pos);
  if (gMap.getZoom() < 15) {
    gMap.setZoom(15);
  }
}

export function clearResultMarker() {
  if (resultMarker) {
    resultMarker.setMap(null);
    resultMarker = null;
  }
}

export function renderPoolPins(places, onPlaceClick) {
  clearPoolPins();
  if (!gMap || !places || places.length === 0 || !window.google) return;

  places.forEach((place) => {
    const marker = new google.maps.Marker({
      position: { lat: place.lat, lng: place.lon },
      map: gMap,
      title: place.name,
      zIndex: 500,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: '#ffffff',
        fillOpacity: 0.9,
        strokeColor: '#f97316',
        strokeWeight: 2,
      },
    });

    marker.addListener('click', () => {
      infoWindow.setContent(`
        <div style="padding: 6px 8px; font-family: sans-serif; color: #12141c; min-width: 140px;">
          <div style="font-weight: 700; font-size: 12px; margin-bottom: 2px;">${escapeHtml(place.name)}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${place.distance ? place.distance.toFixed(1) + ' km' : ''}</div>
          <button id="btn-popup-select-${place.id.replace(/[^a-zA-Z0-9]/g, '')}" style="
            width: 100%;
            padding: 4px 8px;
            background: #f97316;
            color: #ffffff;
            border: none;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
          ">Lihat Pilihan</button>
        </div>
      `);
      infoWindow.open(gMap, marker);

      setTimeout(() => {
        const btnId = `btn-popup-select-${place.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        const btn = document.getElementById(btnId);
        if (btn) {
          btn.onclick = () => {
            if (onPlaceClick) onPlaceClick(place);
            infoWindow.close();
          };
        }
      }, 50);
    });

    poolMarkers.push(marker);
  });
}

export function clearPoolPins() {
  poolMarkers.forEach(m => m.setMap(null));
  poolMarkers = [];
}

function adjustZoomForRadius(km) {
  if (!gMap) return;
  if (km <= 1.5) gMap.setZoom(15);
  else if (km <= 3) gMap.setZoom(14);
  else if (km <= 6) gMap.setZoom(13);
  else if (km <= 12) gMap.setZoom(12);
  else if (km <= 20) gMap.setZoom(11);
  else gMap.setZoom(10);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
