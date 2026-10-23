/**
 * app.js — Main orchestrator for Terserah
 * Connects Leaflet OpenStreetMap, Filters, OpenStreetMap API, UI
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

/* ============================================================
   Application State
   ============================================================ */
const state = {
  lat: -6.2088, // Jakarta center default
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
   Location Management
   ============================================================ */
async function setLocation(lat, lon, knownName = null) {
  state.lat = lat;
  state.lon = lon;
  setUserLocation(lat, lon, state.radiusKm);

  if (knownName) {
    inputLocation.value = knownName.split(',')[0].trim();
  } else {
    inputLocation.value = 'Mencari nama area...';
    const name = await reverseGeocode(lat, lon);
    inputLocation.value = name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

// Map click handler (user clicks anywhere on the map to set location)
async function handleMapClick(lat, lon) {
  await setLocation(lat, lon);
  showToast('Lokasi dipindahkan ke titik yang diklik!', 'success');
}

// Detect GPS location
async function detectLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser tidak mendukung GPS'));
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
  showToast('Mencari sinyal GPS...');
  try {
    const { lat, lon } = await detectLocation();
    await setLocation(lat, lon);
    showToast('Lokasimu berhasil dideteksi!', 'success');
  } catch (err) {
    showToast('GPS tidak dapat diakses. Kamu bisa ketik kota atau klik di peta.', 'error', 4000);
  } finally {
    btnDetectLoc.disabled = false;
  }
});

// Search city/area by typing
async function handleLocationSearch() {
  const query = inputLocation.value.trim();
  if (!query) {
    showToast('Ketik nama kota atau area terlebih dahulu.');
    return;
  }

  showLoading();
  try {
    const result = await searchLocation(query);
    if (result) {
      await setLocation(result.lat, result.lon, result.displayName);
      showToast(`Lokasi disetel ke: ${result.displayName.split(',')[0]}`, 'success');
    } else {
      showToast('Lokasi tidak ditemukan. Coba ketik nama lain atau klik di peta.', 'error');
    }
  } catch {
    showToast('Gagal mencari lokasi. Periksa koneksi.', 'error');
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
// Radius
sliderRadius.addEventListener('input', () => {
  state.radiusKm = parseInt(sliderRadius.value, 10);
  radiusValue.textContent = state.radiusKm;
  updateRadius(state.radiusKm);
});

// Categories (multi-select)
categoryChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  chip.classList.toggle('active');
  const activeChips = [...categoryChips.querySelectorAll('.chip.active')];

  // Keep at least one category selected
  if (activeChips.length === 0) {
    chip.classList.add('active');
    activeChips.push(chip);
  }

  state.categories = activeChips.map(c => c.dataset.value);

  // Show food query input if food or hangout selected
  const showFood = state.categories.some(c => ['food', 'hangout'].includes(c));
  if (groupFood) groupFood.hidden = !showFood;
});

// Budget (single-select)
budgetChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  budgetChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.budget = chip.dataset.value;
});

// Time chips (single-select)
timeChips.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;

  timeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  state.timeOfDay = chip.dataset.value;
});

// Set to current time slot
btnTimeNow.addEventListener('click', () => {
  const hour = new Date().getHours();
  let slot = 'any';
  let slotName = 'Kapan Saja';

  if (hour >= 5 && hour < 11) { slot = 'morning'; slotName = 'Pagi'; }
  else if (hour >= 11 && hour < 14) { slot = 'noon'; slotName = 'Siang'; }
  else if (hour >= 14 && hour < 18) { slot = 'afternoon'; slotName = 'Sore'; }
  else if (hour >= 18) { slot = 'evening'; slotName = 'Malam'; }

  timeChips.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.dataset.value === slot);
  });
  state.timeOfDay = slot;
  showToast(`Waktu disetel ke: ${slotName}`, 'success');
});

// Rating slider
sliderRating.addEventListener('input', () => {
  state.minRating = parseFloat(sliderRating.value);
  ratingValue.textContent = `${state.minRating.toFixed(1)} ⭐`;
});

// Food query
inputFoodQuery.addEventListener('input', () => {
  state.foodQuery = inputFoodQuery.value;
});

/* ============================================================
   Pick Execution
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
      showToast('😕 Tidak ada tempat yang cocok. Coba perbesar radius atau ubah filter.', 'error', 4500);
      btnReroll.hidden = true;
      return false;
    }

    // Render candidates on the map
    renderPoolPins(state.pool, (selectedPlace) => {
      displayPlace(selectedPlace);
    }, CATEGORY_LABELS);

    return true;
  } catch (err) {
    hideLoading();
    console.error('Fetch places error:', err);
    showToast('Terjadi gangguan saat mengambil data tempat.', 'error');
    return false;
  }
}

function displayPlace(place) {
  state.lastPickedId = place.id;
  addToHistory(place);
  showResultOnMap(place);
  showResultCard(place);
  btnReroll.hidden = false;
  btnSurprise.querySelector('span').textContent = 'Pilihkan Lagi!';
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

// CTA Click: Surprise Me / Main Pick
btnSurprise.addEventListener('click', async () => {
  btnSurprise.disabled = true;
  const ok = await fetchAndFilterPool();
  if (ok) {
    pickRandomAndShow();
  }
  btnSurprise.disabled = false;
});

// CTA Click: Re-roll from existing pool
btnReroll.addEventListener('click', () => {
  if (state.pool.length === 0) return;
  hideResultCard();
  showLoading();
  setTimeout(() => {
    pickRandomAndShow();
  }, 400);
});

/* ============================================================
   Boot & Initialization
   ============================================================ */
async function boot() {
  // 1. Initialize map
  initMap(handleMapClick);

  // 2. Initialize UI components
  initResultCardEvents();
  initWishlistDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  initHistoryDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  refreshWishlistBadge();

  // 3. Set default location immediately (Jakarta) so map renders instantly
  await setLocation(state.lat, state.lon, 'Jakarta Pusat');
  refreshMapSize();

  // 4. Silently try geolocation in background without blocking
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await setLocation(pos.coords.latitude, pos.coords.longitude);
        showToast('📍 Lokasi GPS otomatis terpasang!', 'success', 2500);
      },
      () => {
        // Ignored or denied, Jakarta remains active
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  }
}

boot();
