/**
 * storage.js : LocalStorage manager for wishlist, history, and API quota guard
 */

const KEYS = {
  wishlist: 'terserah_wishlist',
  history:  'terserah_history',
  usage:    'terserah_api_usage',
};
const MAX_HISTORY = 20;

function load(key, defaultVal = []) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ---- Wishlist ---- */
export function getWishlist() { return load(KEYS.wishlist, []); }
export function isInWishlist(placeId) { return getWishlist().some(p => p.id === placeId); }

export function addToWishlist(place) {
  const list = getWishlist();
  if (!list.find(p => p.id === place.id)) {
    list.unshift({ ...place, savedAt: Date.now() });
    save(KEYS.wishlist, list);
    return true;
  }
  return false;
}

export function removeFromWishlist(placeId) {
  const list = getWishlist().filter(p => p.id !== placeId);
  save(KEYS.wishlist, list);
}

export function clearWishlist() { save(KEYS.wishlist, []); }

/* ---- History ---- */
export function getHistory() { return load(KEYS.history, []); }

export function addToHistory(place) {
  let list = getHistory();
  list = list.filter(p => p.id !== place.id);
  list.unshift({ ...place, pickedAt: Date.now() });
  if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
  save(KEYS.history, list);
}

export function clearHistory() { save(KEYS.history, []); }

/* ---- API Quota Guard & Pay-As-You-Go Protection ---- */
function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getMonthString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getUsageData() {
  const todayStr = getTodayString();
  const monthStr = getMonthString();

  const data = load(KEYS.usage, {
    date: todayStr,
    dailyCount: 0,
    month: monthStr,
    monthlyCount: 0,
    dailyLimit: 80, // Default limit per day
    monthlyLimit: 1500, // Well below Google $200 free credit
    isLocked: false,
    lockReason: '',
  });

  // Reset daily if date changed
  if (data.date !== todayStr) {
    data.date = todayStr;
    data.dailyCount = 0;
    // Unlock if lock was due to daily quota
    if (data.isLocked && data.lockReason.includes('harian')) {
      data.isLocked = false;
      data.lockReason = '';
    }
  }

  // Reset monthly if month changed
  if (data.month !== monthStr) {
    data.month = monthStr;
    data.monthlyCount = 0;
    data.isLocked = false;
    data.lockReason = '';
  }

  save(KEYS.usage, data);
  return data;
}

export function recordApiCall(calls = 1) {
  const data = getUsageData();
  data.dailyCount += calls;
  data.monthlyCount += calls;

  if (data.dailyCount >= data.dailyLimit) {
    data.isLocked = true;
    data.lockReason = `Batas harian (${data.dailyLimit} panggilan) tercapai`;
  } else if (data.monthlyCount >= data.monthlyLimit) {
    data.isLocked = true;
    data.lockReason = `Batas bulanan (${data.monthlyLimit} panggilan) tercapai`;
  }

  save(KEYS.usage, data);
  return data;
}

export function isQuotaLocked() {
  const data = getUsageData();
  if (data.isLocked) return { locked: true, reason: data.lockReason };
  if (data.dailyCount >= data.dailyLimit) {
    return { locked: true, reason: `Batas harian (${data.dailyLimit} panggilan) tercapai` };
  }
  if (data.monthlyCount >= data.monthlyLimit) {
    return { locked: true, reason: `Batas bulanan (${data.monthlyLimit} panggilan) tercapai` };
  }
  return { locked: false, reason: '' };
}

export function lockDueToGoogleError(reason) {
  const data = getUsageData();
  data.isLocked = true;
  data.lockReason = reason || 'Kredit atau batas kuota Google Cloud terlampaui';
  save(KEYS.usage, data);
  return data;
}

export function updateQuotaLimits(dailyLimit, monthlyLimit) {
  const data = getUsageData();
  if (dailyLimit && dailyLimit > 0) data.dailyLimit = dailyLimit;
  if (monthlyLimit && monthlyLimit > 0) data.monthlyLimit = monthlyLimit;
  save(KEYS.usage, data);
  return data;
}

export function resetSafetyLock() {
  const data = getUsageData();
  data.isLocked = false;
  data.lockReason = '';
  save(KEYS.usage, data);
  return data;
}
