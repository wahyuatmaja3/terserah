/**
 * app.js : Main application controller for Terserah
 * Implements anti-slop principles and React Bits interactions
 */

import { fetchPlaces, reverseGeocode, searchLocation, CATEGORY_LABELS } from './api.js';
import { filterPlaces, pickRandom } from './filter.js';
import { addToHistory } from './storage.js';
import {
  initMap, setUserLocation, updateRadius, showResultOnMap, clearResultMarker,
  renderPoolPins, clearPoolPins, refreshMapSize,
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
const state = {
  lat: -6.2088,
  lon: 106.8456,
  radiusKm: 5,
  categories: ['hangout'],
  budget: 'any',
  timeOfDay: 'any',
  minRating: 3.0,
  foodQuery: '',
  pool: [],
  lastPickedId: null,
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
const timeChips        = $('time-chips');
const btnTimeNow       = $('btn-time-now');
const sliderRating     = $('slider-rating');
const ratingValue      = $('rating-value');
const groupFood        = $('group-food');
const inputFoodQuery   = $('input-food-query');
const btnSurprise      = $('btn-surprise');
const btnReroll        = $('btn-reroll');

/* ============================================================
   Location Handling
   ============================================================ */
async function setLocation(lat, lon, knownName = null) {
  state.lat = lat;
  state.lon = lon;
  setUserLocation(lat, lon, state.radiusKm);

  if (knownName) {
    inputLocation.value = knownName.split(',')[0].trim();
  } else {
    inputLocation.value = 'Mendeteksi area...';
    const name = await reverseGeocode(lat, lon);
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
    const result = await searchLocation(query);
    if (result) {
      await setLocation(result.lat, result.lon, result.displayName);
      showToast(`Lokasi: ${result.displayName.split(',')[0]}`, 'success');
    } else {
      showToast('Area tidak ditemukan. Coba ketik nama lain atau klik pada peta.', 'error');
    }
  } catch {
    showToast('Gagal mencari area. Periksa jaringan.', 'error');
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
  updateRadius(state.radiusKm);
});

categoryChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  chip.classList.toggle('active');
  const activeChips = [...categoryChips.querySelectorAll('.chip.active')];

  if (activeChips.length === 0) {
    chip.classList.add('active');
    activeChips.push(chip);
  }

  state.categories = activeChips.map(c => c.dataset.value);

  const showFood = state.categories.some(c => ['food', 'hangout'].includes(c));
  if (groupFood) groupFood.hidden = !showFood;
});

budgetChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  budgetChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.budget = chip.dataset.value;
});

timeChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  timeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.timeOfDay = chip.dataset.value;
});

btnTimeNow.addEventListener('click', () => {
  const hour = new Date().getHours();
  let slot = 'any';
  let slotLabel = 'Kapan Saja';

  if (hour >= 5 && hour < 11) { slot = 'morning'; slotLabel = 'Pagi'; }
  else if (hour >= 11 && hour < 14) { slot = 'noon'; slotLabel = 'Siang'; }
  else if (hour >= 14 && hour < 18) { slot = 'afternoon'; slotLabel = 'Sore'; }
  else if (hour >= 18) { slot = 'evening'; slotLabel = 'Malam'; }

  timeChips.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === slot);
  });
  state.timeOfDay = slot;
  showToast(`Filter disetel ke: ${slotLabel}`, 'success');
});

sliderRating.addEventListener('input', () => {
  state.minRating = parseFloat(sliderRating.value);
  ratingValue.textContent = `${state.minRating.toFixed(1)} ⭐`;
});

inputFoodQuery.addEventListener('input', () => {
  state.foodQuery = inputFoodQuery.value;
});

/* ============================================================
   Execution
   ============================================================ */
async function fetchAndFilterPool() {
  showLoading();
  clearResultMarker();
  hideResultCard();

  try {
    const rawPlaces = await fetchPlaces({
      categories: state.categories,
      lat: state.lat,
      lon: state.lon,
      radiusKm: state.radiusKm,
      foodQuery: state.foodQuery,
    });

    state.pool = filterPlaces(rawPlaces, {
      timeOfDay: state.timeOfDay,
      minRating: state.minRating,
      budget: state.budget,
      foodQuery: state.foodQuery,
      radiusKm: state.radiusKm,
    }, state.lat, state.lon);

    updatePoolIndicator(state.pool.length);

    if (state.pool.length === 0) {
      hideLoading();
      clearPoolPins();
      showToast('Belum ada tempat yang cocok. Coba perbesar radius atau longgarkan filter.', '', 4500);
      btnReroll.hidden = true;
      return false;
    }

    renderPoolPins(state.pool, (selectedPlace) => {
      displayPlace(selectedPlace);
    }, CATEGORY_LABELS);

    return true;
  } catch (err) {
    hideLoading();
    console.error('Fetch error:', err);
    showToast('Terjadi kendala saat mengambil data.', 'error');
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
  }, 400);
});

/* ============================================================
   Bootstrapping
   ============================================================ */
async function boot() {
  // Initialize React Bits components
  initClickSpark({ sparkColor: '#f97316', sparkSize: 10, sparkCount: 8 });
  initSpotlightCards('.spotlight-card');
  initMagnet('.magnet-btn', 0.22);

  // Initialize Map
  initMap(handleMapClick);

  // Initialize UI events & drawers
  initResultCardEvents();
  initWishlistDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  initHistoryDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  refreshWishlistBadge();

  // Instant default center
  await setLocation(state.lat, state.lon, 'Jakarta Pusat');
  refreshMapSize();

  // Background non-blocking GPS attempt
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setLocation(pos.coords.latitude, pos.coords.longitude);
        showToast('Titik acuan otomatis ke lokasi saat ini', 'success', 2500);
      },
      () => {},
      { timeout: 5000, maximumAge: 60000 }
    );
  }
}

boot();
