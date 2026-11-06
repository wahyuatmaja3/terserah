/**
 * app.js : Main Application Controller for Terserah
 * Uses Offline Scraped Google Maps Data + Leaflet Dark Map
 * 100% Client-side, works on GitHub Pages without API Key
 */

import {
  fetchPlaces, geocodeAddress, reverseGeocodeLatLng,
  loadOfflinePlaces, getDatabaseStats, CATEGORY_LABELS
} from './api.js';
import { filterPlaces, pickRandom } from './filter.js';
import { addToHistory } from './storage.js';
import {
  initMap, setUserLocation, updateRadius, showResultOnMap,
  clearResultMarker, renderPoolPins, clearPoolPins
} from './map.js';
import {
  showToast, showLoading, hideLoading,
  updatePoolIndicator, showResultCard, hideResultCard, initResultCardEvents,
  initWishlistDrawer, initHistoryDrawer, refreshWishlistBadge
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

// Database / Scraper Info Modal Elements
const btnDatabase      = $('btn-database');
const dataModal        = $('database-modal');
const dataBackdrop     = $('database-backdrop');
const dataClose        = $('database-close');
const statTotalPlaces  = $('stat-total-places');
const statCatBreakdown = $('stat-cat-breakdown');
const btnReloadData    = $('btn-reload-data');

/* ============================================================
   Database & Scraper Info Modal Management
   ============================================================ */
async function syncDatabaseInfoUI() {
  const stats = await getDatabaseStats();
  if (statTotalPlaces) {
    statTotalPlaces.textContent = `${stats.total} tempat`;
  }
  if (statCatBreakdown) {
    statCatBreakdown.innerHTML = '';
    Object.entries(CATEGORY_LABELS).forEach(([catKey, info]) => {
      const count = stats.categoryCounts[catKey] || 0;
      const tag = document.createElement('span');
      tag.className = 'meta-tag';
      tag.style.fontSize = '0.75rem';
      tag.textContent = `${info.emoji} ${info.label}: ${count}`;
      statCatBreakdown.appendChild(tag);
    });
  }
}

function openDatabaseModal() {
  syncDatabaseInfoUI();
  if (dataModal) dataModal.hidden = false;
}

function closeDatabaseModal() {
  if (dataModal) dataModal.hidden = true;
}

if (btnDatabase) btnDatabase.addEventListener('click', openDatabaseModal);
if (dataClose) dataClose.addEventListener('click', closeDatabaseModal);
if (dataBackdrop) dataBackdrop.addEventListener('click', closeDatabaseModal);

if (btnReloadData) {
  btnReloadData.addEventListener('click', async () => {
    showLoading();
    try {
      const places = await loadOfflinePlaces(true);
      await syncDatabaseInfoUI();
      await fetchAndFilterPool();
      showToast(`Database berhasil dimuat ulang (${places.length} tempat)`, 'success');
      closeDatabaseModal();
    } catch {
      showToast('Gagal memuat ulang data.', 'error');
    } finally {
      hideLoading();
    }
  });
}

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
    try {
      const addr = await reverseGeocodeLatLng(lat, lon);
      inputLocation.value = addr ? addr.split(',')[0].trim() : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch {
      inputLocation.value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  // Auto refresh candidate pool when location changes
  fetchAndFilterPool();
}

function handleMapClick(lat, lon) {
  clearResultMarker();
  hideResultCard();
  setLocation(lat, lon);
  showToast('Titik acuan dipindahkan.', 'info');
}

// Search location by city/area name
btnSearchLoc.addEventListener('click', async () => {
  const query = inputLocation.value.trim();
  if (!query) {
    showToast('Ketik nama area atau kota terlebih dahulu.');
    return;
  }

  showLoading();
  try {
    const geo = await geocodeAddress(query);
    if (!geo) {
      showToast('Area tidak ditemukan. Coba nama kota yang lebih spesifik.', 'error');
      return;
    }
    await setLocation(geo.lat, geo.lon, geo.displayName);
    showToast(`Lokasi disetel ke: ${geo.displayName.split(',')[0]}`, 'success');
  } catch (err) {
    showToast('Gagal mencari lokasi.', 'error');
  } finally {
    hideLoading();
  }
});

inputLocation.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    btnSearchLoc.click();
  }
});

// GPS Detection
btnDetectLoc.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('Peramban Anda tidak mendukung deteksi GPS.', 'error');
    return;
  }

  showLoading();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await setLocation(pos.coords.latitude, pos.coords.longitude);
      hideLoading();
      showToast('Posisi GPS terdeteksi!', 'success');
    },
    () => {
      hideLoading();
      showToast('Izin GPS ditolak atau gagal mendeteksi posisi.', 'error');
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
});

// Radius Slider
sliderRadius.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  state.radiusKm = val;
  radiusValue.textContent = val;
  updateRadius(val);
});

sliderRadius.addEventListener('change', () => {
  fetchAndFilterPool();
});

// Category Chips
categoryChips.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;

  categoryChips.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state.categories = [btn.dataset.value];
  fetchAndFilterPool();
});

// Budget Chips
budgetChips.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;

  budgetChips.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  state.budget = btn.dataset.value;
  fetchAndFilterPool();
});

// Rating Slider
sliderRating.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  state.minRating = val;
  ratingValue.textContent = `${val.toFixed(1)} ⭐`;
});

sliderRating.addEventListener('change', () => {
  fetchAndFilterPool();
});

// Food / Atmosphere Query
let foodDebounce = null;
inputFoodQuery.addEventListener('input', (e) => {
  state.foodQuery = e.target.value;
  clearTimeout(foodDebounce);
  foodDebounce = setTimeout(() => {
    fetchAndFilterPool();
  }, 450);
});

/* ============================================================
   Pool Fetching & Filtering
   ============================================================ */
async function fetchAndFilterPool() {
  clearPoolPins();
  clearResultMarker();

  try {
    const rawPlaces = await fetchPlaces({
      categories: state.categories,
      lat: state.lat,
      lon: state.lon,
      radiusKm: state.radiusKm,
      foodQuery: state.foodQuery,
    });

    const filtered = filterPlaces(rawPlaces, {
      minRating: state.minRating,
      budget: state.budget,
      radiusKm: state.radiusKm,
    }, state.lat, state.lon);

    state.pool = filtered;
    updatePoolIndicator(state.pool.length);

    if (state.pool.length > 0) {
      renderPoolPins(state.pool, (clickedPlace) => {
        displayPlace(clickedPlace);
      }, CATEGORY_LABELS);
    }

    return state.pool.length > 0;
  } catch (err) {
    console.error('Error fetching pool:', err);
    return false;
  }
}

/* ============================================================
   Random Selection & Display
   ============================================================ */
function displayPlace(place) {
  state.lastPickedId = place.id;
  addToHistory(place);
  showResultOnMap(place);
  showResultCard(place);
  btnReroll.hidden = state.pool.length <= 1;
}

function pickRandomAndShow() {
  const picked = pickRandom(state.pool, state.lastPickedId);
  if (!picked) {
    showToast('Tidak ada tempat yang cocok dengan kriteria saat ini. Coba perbesar radius atau turunkan rating.', 'info');
    return;
  }
  displayPlace(picked);
}

// Action: Surprise me button
btnSurprise.addEventListener('click', async () => {
  btnSurprise.disabled = true;
  showLoading();

  hideResultCard();
  clearResultMarker();

  const hasPool = await fetchAndFilterPool();
  hideLoading();

  if (hasPool) {
    pickRandomAndShow();
  } else {
    showToast('Belum ada tempat di radius ini. Coba klik peta di area lain atau tambah data via scraper.', 'info');
  }

  btnSurprise.disabled = false;
});

// Action: Reroll button
btnReroll.addEventListener('click', () => {
  if (state.pool.length === 0) return;
  hideResultCard();
  showLoading();
  setTimeout(() => {
    hideLoading();
    pickRandomAndShow();
  }, 250);
});

/* ============================================================
   Bootstrapping
   ============================================================ */
async function boot() {
  initClickSpark({ sparkColor: '#f97316', sparkSize: 10, sparkCount: 8 });
  initSpotlightCards('.spotlight-card');
  initMagnet('.magnet-btn', 0.22);

  initResultCardEvents();
  initWishlistDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  initHistoryDrawer((selectedPlace) => {
    displayPlace(selectedPlace);
  });
  refreshWishlistBadge();

  // 1. Initialize Leaflet Map
  initMap(handleMapClick);
  state.mapReady = true;

  // 2. Load places dataset in background
  await loadOfflinePlaces();
  syncDatabaseInfoUI();

  // 3. Set default location
  await setLocation(state.lat, state.lon, 'Jakarta Pusat');

  // 4. Try browser geolocation if available
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
