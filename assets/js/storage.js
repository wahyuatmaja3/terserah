/**
 * storage.js : LocalStorage manager for wishlist & history
 */

const KEYS = {
  wishlist: 'terserah_wishlist',
  history:  'terserah_history',
};
const MAX_HISTORY = 20;

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

/* ---- Wishlist ---- */
export function getWishlist()           { return load(KEYS.wishlist); }
export function isInWishlist(placeId)   { return load(KEYS.wishlist).some(p => p.id === placeId); }

export function addToWishlist(place) {
  const list = load(KEYS.wishlist);
  if (!list.find(p => p.id === place.id)) {
    list.unshift({ ...place, savedAt: Date.now() });
    save(KEYS.wishlist, list);
    return true;
  }
  return false;
}

export function removeFromWishlist(placeId) {
  const list = load(KEYS.wishlist).filter(p => p.id !== placeId);
  save(KEYS.wishlist, list);
}

export function clearWishlist() { save(KEYS.wishlist, []); }

/* ---- History ---- */
export function getHistory() { return load(KEYS.history); }

export function addToHistory(place) {
  let list = load(KEYS.history);
  list = list.filter(p => p.id !== place.id); // remove duplicate
  list.unshift({ ...place, pickedAt: Date.now() });
  if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
  save(KEYS.history, list);
}

export function clearHistory() { save(KEYS.history, []); }
