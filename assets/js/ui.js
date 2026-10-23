/**
 * ui.js : UI presentation and micro-interactions for Terserah
 * Built with anti-slop guidelines and React Bits design patterns
 */

import { CATEGORY_LABELS, BUDGET_LABELS } from './api.js';
import {
  getWishlist, isInWishlist, addToWishlist, removeFromWishlist, clearWishlist,
  getHistory, addToHistory, clearHistory,
} from './storage.js';
import { animateDecryptedText } from './components/decrypted-text.js';

export function showToast(message, type = '', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type ? `toast-${type}` : ''}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.25s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

export function showLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.hidden = false;
}

export function hideLoading() {
  const el = document.getElementById('loading-overlay');
  if (el) el.hidden = true;
}

export function updatePoolIndicator(count) {
  const el = document.getElementById('pool-indicator');
  const countEl = document.getElementById('pool-count');
  if (!el || !countEl) return;

  if (count > 0) {
    countEl.textContent = count;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

let _currentPlace = null;

export function showResultCard(place) {
  _currentPlace = place;

  const overlay = document.getElementById('result-overlay');
  if (!overlay) return;

  const catInfo = CATEGORY_LABELS[place.category] || { emoji: '📍', label: place.category };
  const budgetInfo = BUDGET_LABELS[place.budgetTier] || { label: 'Sedang', icon: '💵', range: 'Rp 30rb - 100rb' };

  // Photo header or fallback pattern
  const visualEl = document.querySelector('.card-visual');
  if (visualEl) {
    if (place.photoUrl) {
      visualEl.style.backgroundImage = `linear-gradient(to top, rgba(9, 10, 15, 0.95), rgba(9, 10, 15, 0.2)), url('${place.photoUrl}')`;
      visualEl.style.backgroundSize = 'cover';
      visualEl.style.backgroundPosition = 'center';
    } else {
      visualEl.style.backgroundImage = 'linear-gradient(135deg, #181b26 0%, #0d0f14 100%)';
    }
  }

  const badgeEl = document.getElementById('result-category-badge');
  if (badgeEl) {
    badgeEl.textContent = `${catInfo.emoji} ${catInfo.label}`;
  }

  // React Bits DecryptedText animation on title
  const nameEl = document.getElementById('result-name');
  if (nameEl) {
    animateDecryptedText(nameEl, place.name);
  }

  // Rating with Google review counts
  const ratingEl = document.getElementById('result-rating');
  if (ratingEl) {
    const reviewsStr = place.ratingsCount ? ` (${place.ratingsCount.toLocaleString('id-ID')} ulasan)` : '';
    ratingEl.textContent = `⭐ ${place.rating ? place.rating.toFixed(1) : '4.5'}${reviewsStr}`;
  }

  const distEl = document.getElementById('result-distance');
  if (distEl) {
    distEl.textContent = `📍 ${place.distance != null ? place.distance.toFixed(1) + ' km' : 'Sekitar lokasi'}`;
  }

  const openEl = document.getElementById('result-open-status');
  if (openEl) {
    if (place.isOpen === true) {
      openEl.textContent = 'Buka Sekarang';
      openEl.className = 'meta-tag open-status open';
    } else if (place.isOpen === false) {
      openEl.textContent = 'Sedang Tutup';
      openEl.className = 'meta-tag open-status closed';
    } else {
      openEl.textContent = 'Jam Fleksibel';
      openEl.className = 'meta-tag open-status unknown';
    }
  }

  const addrEl = document.getElementById('result-address');
  if (addrEl) addrEl.textContent = place.address || 'Alamat di sekitar titik koordinat';

  // Tags & Budget pill
  const tagsEl = document.getElementById('result-tags');
  if (tagsEl) {
    tagsEl.innerHTML = '';

    const bTag = document.createElement('span');
    bTag.className = 'result-tag budget-tag';
    bTag.textContent = `${budgetInfo.icon} ${budgetInfo.label} (${budgetInfo.range})`;
    tagsEl.appendChild(bTag);

    (place.tags || []).slice(0, 4).forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'result-tag';
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
  }

  // Navigation URLs
  const mapsHref = place.placeId
    ? `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
  const wazeHref = `https://waze.com/ul?ll=${place.lat},${place.lon}&navigate=yes`;

  const mapsBtn = document.getElementById('btn-maps');
  const wazeBtn = document.getElementById('btn-waze');
  if (mapsBtn) mapsBtn.href = mapsHref;
  if (wazeBtn) wazeBtn.href = wazeHref;

  updateSaveBtn(place.id);
  overlay.hidden = false;
}

export function hideResultCard() {
  const overlay = document.getElementById('result-overlay');
  if (overlay) overlay.hidden = true;
  _currentPlace = null;
}

function updateSaveBtn(placeId) {
  const btn = document.getElementById('btn-save-wishlist');
  if (!btn) return;
  const saved = isInWishlist(placeId);
  btn.textContent = saved ? 'Tersimpan ❤️' : 'Simpan';
  btn.className = `action-btn btn-wish${saved ? ' saved' : ''}`;
}

export function initResultCardEvents() {
  const closeBtn = document.getElementById('result-close');
  const backdrop = document.getElementById('result-backdrop');
  if (closeBtn) closeBtn.addEventListener('click', hideResultCard);
  if (backdrop) backdrop.addEventListener('click', hideResultCard);

  const saveBtn = document.getElementById('btn-save-wishlist');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!_currentPlace) return;
      if (isInWishlist(_currentPlace.id)) {
        removeFromWishlist(_currentPlace.id);
        showToast('Dihapus dari koleksi');
      } else {
        addToWishlist(_currentPlace);
        showToast('Disimpan ke koleksi pilihan', 'success');
      }
      updateSaveBtn(_currentPlace.id);
      refreshWishlistBadge();
    });
  }

  const shareBtn = document.getElementById('btn-share');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (!_currentPlace) return;
      const mapsUrl = _currentPlace.placeId
        ? `https://www.google.com/maps/place/?q=place_id:${_currentPlace.placeId}`
        : `https://www.google.com/maps/search/?api=1&query=${_currentPlace.lat},${_currentPlace.lon}`;
      const text = `Rekomendasi dari Terserah: "${_currentPlace.name}"\nAlamat: ${_currentPlace.address}\nBuka di Google Maps: ${mapsUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({ title: _currentPlace.name, text });
        } catch {
          // User dismiss
        }
      } else {
        try {
          await navigator.clipboard.writeText(text);
          showToast('Tautan tersalin ke clipboard', 'success');
        } catch {
          showToast('Gagal menyalin tautan.', 'error');
        }
      }
    });
  }
}

export function refreshWishlistBadge() {
  const count = getWishlist().length;
  const badge = document.getElementById('wishlist-badge');
  if (!badge) return;
  badge.textContent = count;
  badge.hidden = count === 0;
}

function renderMiniCard(place, onDelete, onSelect) {
  const catInfo = CATEGORY_LABELS[place.category] || { emoji: '📍' };
  const card = document.createElement('div');
  card.className = 'place-mini-card spotlight-card';
  card.innerHTML = `
    <span class="place-mini-emoji">${catInfo.emoji}</span>
    <div class="place-mini-info">
      <div class="place-mini-name">${escapeHtml(place.name)}</div>
      <div class="place-mini-sub">${place.distance ? place.distance.toFixed(1) + ' km · ' : ''}${escapeHtml(place.address || '')}</div>
    </div>
    ${onDelete ? '<button class="place-mini-del" title="Hapus" aria-label="Hapus dari daftar">✕</button>' : ''}
  `;

  card.addEventListener('click', () => {
    if (onSelect) onSelect(place);
  });

  if (onDelete) {
    const delBtn = card.querySelector('.place-mini-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(place.id);
      });
    }
  }

  return card;
}

export function initWishlistDrawer(onSelectPlace) {
  const overlay = document.getElementById('wishlist-overlay');
  const list    = document.getElementById('wishlist-list');
  const footer  = document.getElementById('wishlist-footer');
  if (!overlay || !list) return;

  const openDrawer = () => {
    const items = getWishlist();
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">Koleksi tersimpan masih kosong.<br><small>Gunakan tombol "Simpan" saat menemukan tempat menarik.</small></p>';
      if (footer) footer.hidden = true;
    } else {
      items.forEach((place) => {
        const card = renderMiniCard(
          place,
          (id) => {
            removeFromWishlist(id);
            refreshWishlistBadge();
            openDrawer();
          },
          (p) => {
            overlay.hidden = true;
            if (onSelectPlace) onSelectPlace(p);
          }
        );
        list.appendChild(card);
      });
      if (footer) footer.hidden = false;
    }
    overlay.hidden = false;
  };

  const btnWishlist = document.getElementById('btn-wishlist');
  const closeBtn = document.getElementById('close-wishlist');
  const backdrop = document.getElementById('wishlist-backdrop');
  const clearBtn = document.getElementById('btn-clear-wishlist');

  if (btnWishlist) btnWishlist.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.hidden = true);
  if (backdrop) backdrop.addEventListener('click', () => overlay.hidden = true);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearWishlist();
      refreshWishlistBadge();
      openDrawer();
      showToast('Koleksi dikosongkan');
    });
  }
}

export function initHistoryDrawer(onSelectPlace) {
  const overlay = document.getElementById('history-overlay');
  const list    = document.getElementById('history-list');
  const footer  = document.getElementById('history-footer');
  if (!overlay || !list) return;

  const openDrawer = () => {
    const items = getHistory();
    list.innerHTML = '';
    if (items.length === 0) {
      list.innerHTML = '<p class="empty-state">Riwayat masih kosong.<br><small>Tempat yang dipilih otomatis tersimpan di sini.</small></p>';
      if (footer) footer.hidden = true;
    } else {
      items.forEach((place) => {
        const card = renderMiniCard(
          place,
          null,
          (p) => {
            overlay.hidden = true;
            if (onSelectPlace) onSelectPlace(p);
          }
        );
        list.appendChild(card);
      });
      if (footer) footer.hidden = false;
    }
    overlay.hidden = false;
  };

  const btnHistory = document.getElementById('btn-history');
  const closeBtn = document.getElementById('close-history');
  const backdrop = document.getElementById('history-backdrop');
  const clearBtn = document.getElementById('btn-clear-history');

  if (btnHistory) btnHistory.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', () => overlay.hidden = true);
  if (backdrop) backdrop.addEventListener('click', () => overlay.hidden = true);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearHistory();
      openDrawer();
      showToast('Riwayat dibersihkan');
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
