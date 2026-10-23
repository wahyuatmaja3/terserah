/**
 * app.js : Main application controller for Terserah
 * Exclusively powered by Google Maps JavaScript API & Google Places
 */

import {
  loadGoogleMapsSDK, initServices, fetchPlacesViaGoogle,
  geocodeAddress, reverseGeocodeLatLng, CATEGORY_LABELS
} from './api.js';
import { filterPlaces, pickRandom } from './filter.js';
import { addToHistory } from './storage.js';
import {
  initGoogleMap, setUserLocation, updateRadius, showResultOnMap,
  clearResultMarker, renderPoolPins, clearPoolPins, getGoogleMapInstance
} from './map.js';
import {
  showToast, showLoading, hideLoading,
  updatePoolIndicator, showResultCard, hideResultCard, initResultCardEvents,
  initWishlistDrawer, initHistoryDrawer, refreshWishlistBadge,
} from './ui.js';
import { initClickSpark } from './components/click-spark.js';
import { initSpotlightCards } from './components/spotlight-card.js';
import { initMagnet } from './components/magnet.js';

/* ============================================================
   State
   ============================================================ */
const STORAGE_KEY_GMAPS = 'terserah_gmaps_key';

const state = {
  apiKey: localStorage.getItem(STORAGE_KEY_GMAPS) || '',
  lat: -6.2088,
  lon: 106.8456,
  radiusKm: 5,
  categories: ['hangout'],
  budget: 'any',
  minRating: 3.0,
  foodQuery: '',
  pool: [],
  lastPickedId: null,
  mapReady: false,
};

/* ============================================================
   DOM References
   ============================================================ */
const $ = id => document.getElementById(id);

const inputLocation    = $('input-location');
const btnSearchLoc     = $('btn-search-location');
const btnDetectLoc     = $('btn-detect-location');
const sliderRadius     = $('slider-radius');
const radiusValue      = $('radius-value');
const categoryChips    = $('category-chips');
const budgetChips      = $('budget-chips');
const sliderRating     = $('slider-rating');
const ratingValue      = $('rating-value');
const inputFoodQuery   = $('input-food-query');
const btnSurprise      = $('btn-surprise');
const btnReroll        = $('btn-reroll');

// API Key Modal Elements
const btnApiKeyHeader  = $('btn-api-key');
const apiKeyModal      = $('api-key-modal');
const apiKeyBackdrop   = $('api-modal-backdrop');
const apiKeyClose      = $('api-modal-close');
const inputApiKey      = $('input-api-key');
const btnSaveApiKey    = $('btn-save-api-key');
const apiKeyBanner     = $('api-key-banner');
const btnOpenApiModal  = $('btn-open-api-modal');

/* ============================================================
   API Key Modal Management
   ============================================================ */
function openApiKeyModal() {
  inputApiKey.value = state.apiKey || '';
  apiKeyModal.hidden = false;
  setTimeout(() => inputApiKey.focus(), 100);
}

function closeApiKeyModal() {
  apiKeyModal.hidden = true;
}

btnApiKeyHeader.addEventListener('click', openApiKeyModal);
apiKeyClose.addEventListener('click', closeApiKeyModal);
apiKeyBackdrop.addEventListener('click', closeApiKeyModal);
if (btnOpenApiModal) btnOpenApiModal.addEventListener('click', openApiKeyModal);

btnSaveApiKey.addEventListener('click', async () => {
  const enteredKey = inputApiKey.value.trim();
  if (!enteredKey) {
    showToast('Masukkan API key yang valid.', 'error');
    return;
  }

  showLoading();
  try {
    await loadGoogleMapsSDK(enteredKey);
    state.apiKey = enteredKey;
    localStorage.setItem(STORAGE_KEY_GMAPS, enteredKey);
    closeApiKeyModal();
    if (apiKeyBanner) apiKeyBanner.hidden = true;

    // Initialize Map and Services
    const gMap = initGoogleMap(state.lat, state.lon, handleMapClick);
    initServices(gMap);
    state.mapReady = true;

    await setLocation(state.lat, state.lon, 'Jakarta Pusat');
    showToast('Google Maps aktif dan siap digunakan!', 'success');
  } catch (err) {
    showToast(err.message || 'Gagal memvalidasi Google Maps API key.', 'error');
  } finally {
    hideLoading();
  }
});

/* ============================================================
   Location Handling via Google Geocoder
   ============================================================ */
async function setLocation(lat, lon, knownName = null) {
  state.lat = lat;
  state.lon = lon;

  if (state.mapReady) {
    setUserLocation(lat, lon, state.radiusKm);
  }

  if (knownName) {
    inputLocation.value = knownName.split(',')[0].trim();
  } else {
    inputLocation.value = 'Mendeteksi alamat...';
    const name = await reverseGeocodeLatLng(lat, lon);
    inputLocation.value = name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

async function handleMapClick(lat, lon) {
  await setLocation(lat, lon);
  showToast('Titik acuan dipindahkan ke lokasi peta', 'success');
}

async function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Perangkat tidak mendukung geolokasi'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  });
}

btnDetectLoc.addEventListener('click', async () => {
  btnDetectLoc.disabled = true;
  showToast('Mencari posisi perangkat...');
  try {
    const { lat, lon } = await detectLocation();
    await setLocation(lat, lon);
    showToast('Posisi berhasil ditemukan', 'success');
  } catch {
    showToast('Izin GPS belum aktif. Kamu dapat mengetik nama kota atau klik peta.', '', 4000);
  } finally {
    btnDetectLoc.disabled = false;
  }
});

async function handleLocationSearch() {
  const query = inputLocation.value.trim();
  if (!query) {
    showToast('Ketik nama area atau kota terlebih dahulu.');
    return;
  }

  showLoading();
  try {
    const result = await geocodeAddress(query);
    if (result) {
      await setLocation(result.lat, result.lon, result.displayName);
      showToast(`Lokasi: ${result.displayName.split(',')[0]}`, 'success');
    } else {
      showToast('Area tidak ditemukan di Google Maps. Coba ketik nama lain.', 'error');
    }
  } catch {
    showToast('Gagal mencari area. Periksa jaringan atau API key.', 'error');
  } finally {
    hideLoading();
  }
}

btnSearchLoc.addEventListener('click', handleLocationSearch);
inputLocation.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handleLocationSearch();
  }
});

/* ============================================================
   Filters
   ============================================================ */
sliderRadius.addEventListener('input', () => {
  state.radiusKm = parseInt(sliderRadius.value, 10);
  radiusValue.textContent = state.radiusKm;
  if (state.mapReady) {
    updateRadius(state.radiusKm);
  }
});

categoryChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;

  chip.classList.toggle('active');
  const activeChips = [...categoryChips.querySelectorAll('.filter-chip.active')];

  if (activeChips.length === 0) {
    chip.classList.add('active');
    activeChips.push(chip);
  }

  state.categories = activeChips.map(c => c.dataset.value);
});

budgetChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;

  budgetChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.budget = chip.dataset.value;
});

sliderRating.addEventListener('input', () => {
  state.minRating = parseFloat(sliderRating.value);
  ratingValue.textContent = `${state.minRating.toFixed(1)} ⭐`;
});

inputFoodQuery.addEventListener('input', () => {
  state.foodQuery = inputFoodQuery.value;
});

/* ============================================================
   Execution via Google Places
   ============================================================ */
async function fetchAndFilterPool() {
  if (!state.mapReady) {
    openApiKeyModal();
    showToast('Pasang Google Maps API key terlebih dahulu.', 'error');
    return false;
  }

  showLoading();
  clearResultMarker();
  hideResultCard();

  try {
    const rawPlaces = await fetchPlacesViaGoogle({
      categories: state.categories,
      lat: state.lat,
      lon: state.lon,
      radiusKm: state.radiusKm,
      foodQuery: state.foodQuery,
    });

    state.pool = filterPlaces(rawPlaces, {
      minRating: state.minRating,
      budget: state.budget,
      radiusKm: state.radiusKm,
    }, state.lat, state.lon);

    updatePoolIndicator(state.pool.length);

    if (state.pool.length === 0) {
      hideLoading();
      clearPoolPins();
      showToast('Belum ada tempat yang cocok di Google Maps. Coba perbesar radius atau ubah filter.', '', 4500);
      btnReroll.hidden = true;
      return false;
    }

    renderPoolPins(state.pool, (selectedPlace) => {
      displayPlace(selectedPlace);
    });

    return true;
  } catch (err) {
    hideLoading();
    console.error('Google Places error:', err);
    showToast('Terjadi kendala saat mengakses Google Places API.', 'error');
    return false;
  }
}

function displayPlace(place) {
  state.lastPickedId = place.id;
  addToHistory(place);
  showResultOnMap(place);
  showResultCard(place);
  btnReroll.hidden = false;
  btnSurprise.querySelector('.btn-label').textContent = 'Pilihkan Lagi';
}

function pickRandomAndShow() {
  const place = pickRandom(state.pool, state.lastPickedId);
  if (!place) {
    hideLoading();
    return;
  }
  hideLoading();
  displayPlace(place);
}

btnSurprise.addEventListener('click', async () => {
  btnSurprise.disabled = true;
  const ok = await fetchAndFilterPool();
  if (ok) {
    pickRandomAndShow();
  }
  btnSurprise.disabled = false;
});

btnReroll.addEventListener('click', () => {
  if (state.pool.length === 0) return;
  hideResultCard();
  showLoading();
  setTimeout(() => {
    pickRandomAndShow();
  }, 350);
});

/* ============================================================
   Bootstrapping
   ============================================================ */
async function boot() {
  // Initialize React Bits components
  initClickSpark({ sparkColor: '#f97316', sparkSize: 10, sparkCount: 8 });
  initSpotlightCards('.spotlight-card');
  initMagnet('.magnet-btn', 0.22);

  // Initialize UI drawers
  initResultCardEvents();
  initWishlistDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  initHistoryDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  refreshWishlistBadge();

  // Check Google Maps API Key
  if (state.apiKey) {
    try {
      showLoading();
      await loadGoogleMapsSDK(state.apiKey);
      const gMap = initGoogleMap(state.lat, state.lon, handleMapClick);
      initServices(gMap);
      state.mapReady = true;
      if (apiKeyBanner) apiKeyBanner.hidden = true;
      await setLocation(state.lat, state.lon, 'Jakarta Pusat');
    } catch (err) {
      console.warn('Gagal memuat Google Maps SDK dengan kunci tersimpan:', err);
      if (apiKeyBanner) apiKeyBanner.hidden = false;
    } finally {
      hideLoading();
    }
  } else {
    // Show banner prompting user to enter Google Maps API key
    if (apiKeyBanner) apiKeyBanner.hidden = false;
    inputLocation.value = 'Jakarta Pusat (Belum aktif)';
  }

  // Background non-blocking GPS attempt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setLocation(pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { timeout: 5000, maximumAge: 60000 }
    );
  }
}

boot();
