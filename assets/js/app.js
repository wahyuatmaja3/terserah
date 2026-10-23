/**
 * app.js — Main entry point for Terserah
 * Orchestrates: map, filters, API, picker, UI
 */

import { fetchPlaces, reverseGeocode } from './api.js';
import { filterPlaces, pickRandom } from './filter.js';
import { addToHistory } from './storage.js';
import { initMap, setUserLocation, updateRadius, showResultOnMap, clearResultMarker } from './map.js';
import {
  showToast, showLoading, hideLoading,
  updatePoolIndicator, showResultCard, hideResultCard, initResultCardEvents,
  initWishlistDrawer, initHistoryDrawer, refreshWishlistBadge,
} from './ui.js';

/* ============================================================
   State
   ============================================================ */
const state = {
  lat: null,
  lon: null,
  radiusKm: 5,
  categories: ['hangout'],
  timeOfDay: 'any',
  minRating: 3.0,
  foodQuery: '',
  pool: [],        // current filtered pool
  poolIndex: -1,   // last picked index (for re-roll dedup)
};

/* ============================================================
   DOM references
   ============================================================ */
const $ = id => document.getElementById(id);

const inputLocation  = $('input-location');
const sliderRadius   = $('slider-radius');
const radiusValue    = $('radius-value');
const sliderRating   = $('slider-rating');
const ratingValue    = $('rating-value');
const categoryChips  = $('category-chips');
const timeChips      = $('time-chips');
const groupFood      = $('group-food');
const inputFoodQuery = $('input-food-query');
const btnDetect      = $('btn-detect-location');
const btnTimeNow     = $('btn-time-now');
const btnSurprise    = $('btn-surprise');
const btnReroll      = $('btn-reroll');

/* ============================================================
   Geolocation
   ============================================================ */
async function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung browser ini'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      err => reject(err),
      { timeout: 10000, maximumAge: 60000 }
    );
  });
}

async function setLocation(lat, lon) {
  state.lat = lat;
  state.lon = lon;
  setUserLocation(lat, lon, state.radiusKm);

  inputLocation.value = 'Mendeteksi nama area...';
  const name = await reverseGeocode(lat, lon);
  inputLocation.value = name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

btnDetect.addEventListener('click', async () => {
  try {
    btnDetect.disabled = true;
    const { lat, lon } = await detectLocation();
    await setLocation(lat, lon);
    showToast('Lokasi terdeteksi!', 'success');
  } catch (err) {
    showToast('Gagal deteksi lokasi. Periksa izin GPS.', 'error');
  } finally {
    btnDetect.disabled = false;
  }
});

/* ============================================================
   Radius Slider
   ============================================================ */
sliderRadius.addEventListener('input', () => {
  state.radiusKm = parseInt(sliderRadius.value);
  radiusValue.textContent = state.radiusKm;
  updateRadius(state.radiusKm);
});

/* ============================================================
   Rating Slider
   ============================================================ */
sliderRating.addEventListener('input', () => {
  state.minRating = parseFloat(sliderRating.value);
  ratingValue.textContent = `${state.minRating.toFixed(1)} ⭐`;
});

/* ============================================================
   Category Chips (multi-select)
   ============================================================ */
categoryChips.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  chip.classList.toggle('active');

  state.categories = [...categoryChips.querySelectorAll('.chip.active')]
    .map(c => c.dataset.value);

  // Show food query input if food or hangout selected
  const showFoodFilter = state.categories.some(c => ['food', 'hangout'].includes(c));
  groupFood.hidden = !showFoodFilter;

  // Require at least one category
  if (state.categories.length === 0) {
    chip.classList.add('active');
    state.categories = [chip.dataset.value];
  }
});

/* ============================================================
   Time Chips (single-select)
   ============================================================ */
timeChips.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  timeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.timeOfDay = chip.dataset.value;
});

btnTimeNow.addEventListener('click', () => {
  const hour = new Date().getHours();
  let slot = 'any';
  if (hour >= 5  && hour < 11) slot = 'morning';
  else if (hour >= 11 && hour < 14) slot = 'noon';
  else if (hour >= 14 && hour < 18) slot = 'afternoon';
  else if (hour >= 18)              slot = 'evening';

  timeChips.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === slot);
  });
  state.timeOfDay = slot;
  showToast(`Waktu diatur ke: ${slot === 'morning' ? 'Pagi' : slot === 'noon' ? 'Siang' : slot === 'afternoon' ? 'Sore' : 'Malam'}`, 'success');
});

/* ============================================================
   Food Query
   ============================================================ */
inputFoodQuery.addEventListener('input', () => {
  state.foodQuery = inputFoodQuery.value;
});

/* ============================================================
   Main Pick Logic
   ============================================================ */
async function fetchAndFilterPool() {
  if (!state.lat || !state.lon) {
    showToast('Lokasi belum diset. Klik ikon GPS 📍', 'error');
    return false;
  }

  showLoading();
  clearResultMarker();
  hideResultCard();

  try {
    const raw = await fetchPlaces({
      categories: state.categories,
      lat: state.lat,
      lon: state.lon,
      radiusKm: state.radiusKm,
    });

    state.pool = filterPlaces(raw, {
      timeOfDay: state.timeOfDay,
      minRating: state.minRating,
      foodQuery: state.foodQuery,
    }, state.lat, state.lon);

    updatePoolIndicator(state.pool.length);

    if (state.pool.length === 0) {
      hideLoading();
      showToast('😕 Tidak ada tempat yang cocok. Coba perluas radius atau ubah filter.', 'error', 4000);
      btnReroll.hidden = true;
      return false;
    }

    return true;
  } catch (err) {
    hideLoading();
    console.error(err);
    showToast('Gagal mengambil data. Cek koneksi internet.', 'error');
    return false;
  }
}

function pickAndShow() {
  const place = pickRandom(state.pool);
  if (!place) return;

  hideLoading();
  addToHistory(place);
  showResultOnMap(place);
  showResultCard(place);
  btnReroll.hidden = false;
  btnSurprise.querySelector('span').textContent = 'Pilihkan Lagi!';
}

btnSurprise.addEventListener('click', async () => {
  btnSurprise.disabled = true;
  const ok = await fetchAndFilterPool();
  if (ok) pickAndShow();
  btnSurprise.disabled = false;
});

btnReroll.addEventListener('click', () => {
  if (state.pool.length === 0) return;
  hideResultCard();

  // Brief loading flash
  showLoading();
  setTimeout(() => {
    pickAndShow();
  }, 400);
});

/* ============================================================
   Boot
   ============================================================ */
async function boot() {
  initMap();
  initResultCardEvents();
  initWishlistDrawer();
  initHistoryDrawer();
  refreshWishlistBadge();

  // Try auto-detect location on load
  try {
    const { lat, lon } = await detectLocation();
    await setLocation(lat, lon);
  } catch {
    // Set Jakarta as default
    await setLocation(-6.2088, 106.8456);
    inputLocation.value = 'Jakarta (default)';
    showToast('GPS tidak tersedia — menggunakan lokasi default Jakarta', '', 4000);
  }
}

boot();
