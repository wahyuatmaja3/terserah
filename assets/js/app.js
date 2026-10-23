/**
 * app.js : Main application controller for Terserah
 * Exclusively powered by Google Maps JavaScript API & Google Places
 * Features Anti Pay-As-You-Go Quota Protection
 */

import {
  loadGoogleMapsSDK, initServices, fetchPlacesViaGoogle,
  geocodeAddress, reverseGeocodeLatLng, CATEGORY_LABELS
} from './api.js';
import { filterPlaces, pickRandom } from './filter.js';
import {
  addToHistory, getUsageData, isQuotaLocked, updateQuotaLimits, resetSafetyLock
} from './storage.js';
import {
  initGoogleMap, setUserLocation, updateRadius, showResultOnMap,
  clearResultMarker, renderPoolPins, clearPoolPins
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

// Quota Protection Elements
const quotaLockBanner     = $('quota-lock-banner');
const quotaLockDesc       = $('quota-lock-desc');
const btnManageQuota      = $('btn-manage-quota');
const statDailyCalls      = $('stat-daily-calls');
const statMonthlyCalls    = $('stat-monthly-calls');
const inputDailyLimit     = $('input-daily-limit');
const quotaLockStatusArea = $('quota-lock-status-area');
const lockReasonText      = $('lock-reason-text');
const btnResetLock        = $('btn-reset-lock');

/* ============================================================
   Quota Safety & Pay-As-You-Go Guard
   ============================================================ */
function syncQuotaUI() {
  const usage = getUsageData();
  const quota = isQuotaLocked();

  if (statDailyCalls) {
    statDailyCalls.textContent = `${usage.dailyCount} / ${usage.dailyLimit}`;
  }
  if (statMonthlyCalls) {
    statMonthlyCalls.textContent = `${usage.monthlyCount} / ${usage.monthlyLimit}`;
  }
  if (inputDailyLimit) {
    inputDailyLimit.value = usage.dailyLimit;
  }

  if (quota.locked) {
    if (quotaLockBanner) {
      quotaLockBanner.hidden = false;
      quotaLockDesc.textContent = `${quota.reason}. Program dihentikan sementara untuk menghindari tagihan.`;
    }
    if (quotaLockStatusArea) {
      quotaLockStatusArea.hidden = false;
      lockReasonText.textContent = `Terkunci: ${quota.reason}`;
    }
    btnSurprise.disabled = true;
    btnSurprise.querySelector('.btn-label').textContent = 'Batas Kuota Tercapai';
  } else {
    if (quotaLockBanner) quotaLockBanner.hidden = true;
    if (quotaLockStatusArea) quotaLockStatusArea.hidden = true;
    btnSurprise.disabled = false;
    btnSurprise.querySelector('.btn-label').textContent = state.pool.length > 0 ? 'Pilihkan Lagi' : 'Pilihkan Tempat Sekarang';
  }
}

if (btnManageQuota) {
  btnManageQuota.addEventListener('click', openApiKeyModal);
}

if (btnResetLock) {
  btnResetLock.addEventListener('click', () => {
    resetSafetyLock();
    syncQuotaUI();
    showToast('Kunci pengaman dibuka kembali.', 'success');
  });
}

/* ============================================================
   API Key Modal Management
   ============================================================ */
function openApiKeyModal() {
  inputApiKey.value = state.apiKey || '';
  syncQuotaUI();
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
  const newDailyLimit = parseInt(inputDailyLimit.value, 10);

  if (newDailyLimit && newDailyLimit > 0) {
    updateQuotaLimits(newDailyLimit, null);
  }

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

    const gMap = initGoogleMap(state.lat, state.lon, handleMapClick);
    initServices(gMap);
    state.mapReady = true;

    await setLocation(state.lat, state.lon, 'Jakarta Pusat');
    syncQuotaUI();
    showToast('Google Maps & Pengaman Kuota siap digunakan!', 'success');
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
  syncQuotaUI();
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
  } catch (err) {
    showToast(err.message || 'Gagal mencari area.', 'error');
  } finally {
    hideLoading();
    syncQuotaUI();
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
   Execution via Google Places with Quota Guard
   ============================================================ */
async function fetchAndFilterPool() {
  if (!state.mapReady) {
    openApiKeyModal();
    showToast('Pasang Google Maps API key terlebih dahulu.', 'error');
    return false;
  }

  const quota = isQuotaLocked();
  if (quota.locked) {
    syncQuotaUI();
    showToast(`Perlindungan Kuota: ${quota.reason}`, 'error', 4500);
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
    syncQuotaUI();

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
    syncQuotaUI();
    console.error('Google Places error:', err);
    showToast(err.message || 'Terjadi kendala saat mengakses Google Places API.', 'error', 4500);
    return false;
  }
}

function displayPlace(place) {
  state.lastPickedId = place.id;
  addToHistory(place);
  showResultOnMap(place);
  showResultCard(place);
  btnReroll.hidden = false;
  syncQuotaUI();
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
  syncQuotaUI();

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
      syncQuotaUI();
    }
  } else {
    if (apiKeyBanner) apiKeyBanner.hidden = false;
    inputLocation.value = 'Jakarta Pusat (Belum aktif)';
  }

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
