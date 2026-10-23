/**
 * ui.js — UI helpers: toast, loading, drawers, result card
 */

import { CATEGORY_LABELS } from './api.js';
import {
  getWishlist, isInWishlist, addToWishlist, removeFromWishlist, clearWishlist,
  getHistory, addToHistory, clearHistory,
} from './storage.js';

/* ========== Toast ========== */
export function showToast(message, type = '', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type ? `toast-${type}` : ''}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ========== Loading ========== */
export function showLoading()  { document.getElementById('loading-overlay').hidden = false; }
export function hideLoading()  { document.getElementById('loading-overlay').hidden = true;  }

/* ========== Pool Indicator ========== */
export function updatePoolIndicator(count) {
  const el = document.getElementById('pool-indicator');
  const countEl = document.getElementById('pool-count');
  if (count > 0) {
    countEl.textContent = count;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

/* ========== Result Card ========== */
let _currentPlace = null;

export function showResultCard(place, onReRoll) {
  _currentPlace = place;

  const overlay = document.getElementById('result-overlay');
  const catInfo  = CATEGORY_LABELS[place.category] || { emoji: '📍', label: place.category };

  // Photo — use OSM wiki image if available, else placeholder
  const photo = document.getElementById('result-photo');
  photo.src = 'assets/images/placeholder.svg';
  photo.alt = place.name;

  document.getElementById('result-category-badge').textContent =
    `${catInfo.emoji} ${catInfo.label}`;

  document.getElementById('result-name').textContent = place.name;

  // Meta
  document.getElementById('result-distance').textContent =
    `📍 ${place.distance != null ? place.distance.toFixed(1) + ' km' : '—'}`;

  document.getElementById('result-rating').textContent = '⭐ OSM';

  const openEl = document.getElementById('result-open-status');
  if (place.openStatus === 'open') {
    openEl.textContent = '✅ Buka';
    openEl.className = 'meta-item open-status open';
  } else if (place.openStatus === 'closed') {
    openEl.textContent = '❌ Tutup';
    openEl.className = 'meta-item open-status closed';
  } else {
    openEl.textContent = '🕐 Jam tidak diketahui';
    openEl.className = 'meta-item open-status unknown';
  }

  document.getElementById('result-address').textContent = place.address || '—';

  // Tags
  const tagsEl = document.getElementById('result-tags');
  tagsEl.innerHTML = '';
  (place.tags || []).slice(0, 5).forEach(tag => {
    const span = document.createElement('span');
    span.className = 'result-tag';
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  // Nav buttons
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
  const wazeHref = `https://waze.com/ul?ll=${place.lat},${place.lon}&navigate=yes`;
  document.getElementById('btn-maps').href = mapsHref;
  document.getElementById('btn-waze').href = wazeHref;

  // Wishlist button
  updateSaveBtn(place.id);

  overlay.hidden = false;
}

export function hideResultCard() {
  document.getElementById('result-overlay').hidden = true;
  _currentPlace = null;
}

function updateSaveBtn(placeId) {
  const btn = document.getElementById('btn-save-wishlist');
  const saved = isInWishlist(placeId);
  btn.textContent = saved ? '❤️ Tersimpan' : '🤍 Simpan';
  btn.className   = `btn-action btn-save${saved ? ' saved' : ''}`;
}

export function initResultCardEvents() {
  document.getElementById('result-close').addEventListener('click', hideResultCard);
  document.getElementById('result-backdrop').addEventListener('click', hideResultCard);

  document.getElementById('btn-save-wishlist').addEventListener('click', () => {
    if (!_currentPlace) return;
    if (isInWishlist(_currentPlace.id)) {
      removeFromWishlist(_currentPlace.id);
      showToast('Dihapus dari wishlist');
    } else {
      addToWishlist(_currentPlace);
      showToast('Disimpan ke wishlist ❤️', 'success');
    }
    updateSaveBtn(_currentPlace.id);
    refreshWishlistBadge();
  });

  document.getElementById('btn-share').addEventListener('click', async () => {
    if (!_currentPlace) return;
    const text = `${_currentPlace.name}\n📍 ${_currentPlace.address}\n\nDitemukan pakai Terserah! 🎲`;
    if (navigator.share) {
      try { await navigator.share({ title: _currentPlace.name, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Link disalin ke clipboard!', 'success');
    }
  });
}

/* ========== Wishlist & History Drawers ========== */
export function refreshWishlistBadge() {
  const count = getWishlist().length;
  const badge = document.getElementById('wishlist-badge');
  badge.textContent = count;
  badge.hidden = count === 0;
}

function renderMiniCard(place, onDelete) {
  const catInfo = CATEGORY_LABELS[place.category] || { emoji: '📍' };
  const card = document.createElement('div');
  card.className = 'place-mini-card';
  card.innerHTML = `
    <span class="place-mini-emoji">${catInfo.emoji}</span>
    <div class="place-mini-info">
      <div class="place-mini-name">${escapeHtml(place.name)}</div>
      <div class="place-mini-sub">${place.distance ? place.distance.toFixed(1) + ' km · ' : ''}${place.address || ''}</div>
    </div>
    <button class="place-mini-del" title="Hapus" aria-label="Hapus dari daftar">🗑️</button>
  `;
  card.querySelector('.place-mini-del').addEventListener('click', e => {
    e.stopPropagation();
    onDelete(place.id);
  });
  return card;
}

export function initWishlistDrawer() {
  const overlay = document.getElementById('wishlist-overlay');
  const list    = document.getElementById('wishlist-list');
  const footer  = document.getElementById('wishlist-footer');

  const openDrawer = () => {
    const items = getWishlist();
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">Belum ada tempat tersimpan.</p>';
      footer.hidden = true;
    } else {
      items.forEach(place => {
        const card = renderMiniCard(place, id => {
          removeFromWishlist(id);
          refreshWishlistBadge();
          openDrawer();
        });
        list.appendChild(card);
      });
      footer.hidden = false;
    }
    overlay.hidden = false;
  };

  document.getElementById('btn-wishlist').addEventListener('click', openDrawer);
  document.getElementById('close-wishlist').addEventListener('click', () => overlay.hidden = true);
  document.getElementById('wishlist-backdrop').addEventListener('click', () => overlay.hidden = true);
  document.getElementById('btn-clear-wishlist').addEventListener('click', () => {
    clearWishlist();
    refreshWishlistBadge();
    openDrawer();
    showToast('Wishlist dikosongkan');
  });
}

export function initHistoryDrawer() {
  const overlay = document.getElementById('history-overlay');
  const list    = document.getElementById('history-list');
  const footer  = document.getElementById('history-footer');

  const openDrawer = () => {
    const items = getHistory();
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">Belum ada riwayat pick.</p>';
      footer.hidden = true;
    } else {
      items.forEach(place => {
        const card = renderMiniCard(place, () => {}); // history: no delete per item
        list.appendChild(card);
      });
      footer.hidden = false;
    }
    overlay.hidden = false;
  };

  document.getElementById('btn-history').addEventListener('click', openDrawer);
  document.getElementById('close-history').addEventListener('click', () => overlay.hidden = true);
  document.getElementById('history-backdrop').addEventListener('click', () => overlay.hidden = true);
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    clearHistory();
    openDrawer();
    showToast('Riwayat dihapus');
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}
