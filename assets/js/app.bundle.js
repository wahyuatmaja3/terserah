/**
 * app.bundle.js : Standalone Universal Bundle for Terserah
 * Compatible with BOTH file:// (double-click index.html) and http:// (GitHub Pages)
 * Eliminates CORS blocking on file:// protocol while preserving full functionality
 */

(() => {
  'use strict';

  /* ============================================================
     1. Components (React Bits in Vanilla JS)
     ============================================================ */

  // ClickSpark
  function initClickSpark(options = {}) {
    const {
      sparkColor = '#f97316',
      sparkSize = 10,
      sparkCount = 8,
      duration = 450,
      extraScale = 1.0,
    } = options;

    const canvas = document.createElement('canvas');
    canvas.id = 'click-spark-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let sparks = [];
    let animId = null;

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resize();
    window.addEventListener('resize', resize);

    class Spark {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = Math.random() * Math.PI * 2;
        this.speed = (Math.random() * 3 + 2) * extraScale;
        this.size = (Math.random() * sparkSize + 4) * extraScale;
        this.color = sparkColor;
        this.createdAt = performance.now();
        this.lifespan = duration;
      }
      update(now) {
        const age = now - this.createdAt;
        if (age > this.lifespan) return false;
        const progress = age / this.lifespan;
        this.x += Math.cos(this.angle) * this.speed * (1 - progress * 0.4);
        this.y += Math.sin(this.angle) * this.speed * (1 - progress * 0.4);
        this.currentSize = this.size * (1 - progress);
        this.alpha = 1 - progress;
        return true;
      }
      draw(c) {
        c.save();
        c.globalAlpha = Math.max(0, this.alpha);
        c.fillStyle = this.color;
        c.shadowColor = this.color;
        c.shadowBlur = 8;
        c.beginPath();
        c.arc(this.x, this.y, Math.max(0, this.currentSize), 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    function loop(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      sparks = sparks.filter(s => {
        const alive = s.update(now);
        if (alive) s.draw(ctx);
        return alive;
      });
      if (sparks.length > 0) {
        animId = requestAnimationFrame(loop);
      } else {
        animId = null;
      }
    }

    window.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      for (let i = 0; i < sparkCount; i++) {
        sparks.push(new Spark(x, y));
      }
      if (!animId) {
        animId = requestAnimationFrame(loop);
      }
    });
  }

  // SpotlightCard
  function initSpotlightCards(selector = '.spotlight-card') {
    function handleMouseMove(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }

    function attachCard(card) {
      if (card._spotlightAttached) return;
      card._spotlightAttached = true;
      card.addEventListener('mousemove', handleMouseMove);
    }

    document.querySelectorAll(selector).forEach(attachCard);
    const observer = new MutationObserver(() => {
      document.querySelectorAll(selector).forEach(attachCard);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // DecryptedText
  const CHAR_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*?';
  function animateDecryptedText(element, targetText, options = {}) {
    if (!element) return;
    const { speed = 28, maxIterations = 14, revealDelay = 25 } = options;
    const textLen = targetText.length;
    let revealedIndices = new Set();
    let iterations = 0;

    clearInterval(element._decryptInterval);
    const interval = setInterval(() => {
      iterations++;
      const revealCount = Math.floor(iterations / (revealDelay / speed));
      for (let i = 0; i < revealCount && i < textLen; i++) {
        revealedIndices.add(i);
      }
      const scrambled = targetText
        .split('')
        .map((char, index) => {
          if (char === ' ' || char === '\n') return char;
          if (revealedIndices.has(index)) return targetText[index];
          return CHAR_POOL[Math.floor(Math.random() * CHAR_POOL.length)];
        })
        .join('');
      element.textContent = scrambled;

      if (revealedIndices.size >= textLen || iterations > maxIterations * 3) {
        clearInterval(interval);
        element.textContent = targetText;
        element._decryptInterval = null;
      }
    }, speed);
    element._decryptInterval = interval;
  }

  // Magnet
  function initMagnet(selector = '.magnet-btn', strength = 0.25) {
    document.querySelectorAll(selector).forEach((el) => {
      let bounds = null;
      el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
      el.addEventListener('mousemove', (e) => {
        if (!bounds) bounds = el.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const deltaX = (e.clientX - centerX) * strength;
        const deltaY = (e.clientY - centerY) * strength;
        el.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translate3d(0px, 0px, 0)';
        bounds = null;
      });
    });
  }

  /* ============================================================
     2. Storage (Wishlist & History)
     ============================================================ */
  const KEYS = {
    wishlist: 'terserah_wishlist',
    history:  'terserah_history',
  };
  const MAX_HISTORY = 20;

  function loadStorage(key, defaultVal = []) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch {
      return defaultVal;
    }
  }

  function saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  function getWishlist() { return loadStorage(KEYS.wishlist, []); }
  function isInWishlist(placeId) { return getWishlist().some(p => p.id === placeId); }
  function addToWishlist(place) {
    const list = getWishlist();
    if (!list.find(p => p.id === place.id)) {
      list.unshift({ ...place, savedAt: Date.now() });
      saveStorage(KEYS.wishlist, list);
      return true;
    }
    return false;
  }
  function removeFromWishlist(placeId) {
    const list = getWishlist().filter(p => p.id !== placeId);
    saveStorage(KEYS.wishlist, list);
  }
  function clearWishlist() { saveStorage(KEYS.wishlist, []); }

  function getHistory() { return loadStorage(KEYS.history, []); }
  function addToHistory(place) {
    let list = getHistory();
    list = list.filter(p => p.id !== place.id);
    list.unshift({ ...place, pickedAt: Date.now() });
    if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
    saveStorage(KEYS.history, list);
  }
  function clearHistory() { saveStorage(KEYS.history, []); }

  /* ============================================================
     3. Filter & Distance Logic
     ============================================================ */
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function filterPlaces(places, filters, userLat, userLon) {
    const { minRating = 1.0, budget = 'any', radiusKm = 5 } = filters;

    const candidates = places
      .map((place) => {
        const distance = haversineKm(userLat, userLon, place.lat, place.lon);
        return { ...place, distance };
      })
      .filter((place) => {
        if (place.distance > radiusKm * 1.5) return false;
        if (minRating > 1.0 && place.rating < (minRating - 0.2)) return false;
        if (budget !== 'any' && place.budgetTier && place.budgetTier !== budget) return false;
        return true;
      })
      .reduce((acc, place) => {
        const existing = acc.find(p => p.name.toLowerCase() === place.name.toLowerCase());
        if (!existing) {
          acc.push(place);
        } else if (place.distance < existing.distance) {
          const idx = acc.indexOf(existing);
          acc[idx] = place;
        }
        return acc;
      }, []);

    return candidates.sort((a, b) => a.distance - b.distance);
  }

  function pickRandom(pool, lastPickedId = null) {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];
    const candidates = pool.filter(p => p.id !== lastPickedId);
    const targetList = candidates.length > 0 ? candidates : pool;
    const idx = Math.floor(Math.random() * targetList.length);
    return targetList[idx];
  }

  /* ============================================================
     4. Data & API Provider (Offline Scraped Google Maps)
     ============================================================ */
  const CATEGORY_LABELS = {
    hangout:       { emoji: '☕', label: 'Nongkrong' },
    food:          { emoji: '🍜', label: 'Makan' },
    snack:         { emoji: '🥟', label: 'Jajan' },
    entertainment: { emoji: '🎮', label: 'Hiburan' },
    nature:        { emoji: '🌿', label: 'Alam' },
    shopping:      { emoji: '🛍️', label: 'Belanja' },
    culture:       { emoji: '🎨', label: 'Budaya' },
    fitness:       { emoji: '🏋️', label: 'Olahraga' },
    spiritual:     { emoji: '🕌', label: 'Religi' },
  };

  const BUDGET_LABELS = {
    cheap:    { label: 'Hemat', range: '< Rp 30.000', icon: '🪙', priceLevel: 1 },
    moderate: { label: 'Sedang', range: 'Rp 30.000 - 100.000', icon: '💵', priceLevel: 2 },
    pricey:   { label: 'Agak Mahal', range: 'Rp 100.000 - 300.000', icon: '💳', priceLevel: 3 },
    luxury:   { label: 'Mewah', range: '> Rp 300.000', icon: '💎', priceLevel: 4 },
  };

  let placesCache = null;

  async function loadOfflinePlaces(forceReload = false) {
    // 1. If global window.TERSERAH_PLACES is available (loaded via script tag)
    if (window.TERSERAH_PLACES && Array.isArray(window.TERSERAH_PLACES) && window.TERSERAH_PLACES.length > 0 && !forceReload) {
      placesCache = window.TERSERAH_PLACES;
      return placesCache;
    }

    if (placesCache && !forceReload) {
      return placesCache;
    }

    // 2. Fallback to fetch (for HTTP/HTTPS / GitHub Pages)
    try {
      const res = await fetch('assets/data/places.json?v=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          placesCache = data;
          return placesCache;
        }
      }
    } catch {}

    placesCache = window.TERSERAH_PLACES || placesCache || [];
    return placesCache;
  }

  async function getDatabaseStats() {
    const places = await loadOfflinePlaces();
    const categoryCounts = {};
    places.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    return {
      total: places.length,
      categoryCounts,
    };
  }

  async function fetchPlaces({ categories = ['hangout'], lat, lon, radiusKm = 5, foodQuery = '' }) {
    const allPlaces = await loadOfflinePlaces();
    if (!allPlaces || allPlaces.length === 0) return [];

    const queryTerms = (foodQuery || '')
      .toLowerCase()
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const candidates = allPlaces
      .map(p => {
        const distance = haversineKm(lat, lon, p.lat, p.lon);
        return { ...p, distance };
      })
      .filter(p => {
        if (categories && categories.length > 0 && !categories.includes(p.category)) {
          return false;
        }
        if (queryTerms.length > 0) {
          const textTarget = `${p.name} ${p.address} ${(p.tags || []).join(' ')} ${p.category}`.toLowerCase();
          const matchesAny = queryTerms.some(term => textTarget.includes(term));
          if (!matchesAny) return false;
        }
        return true;
      });

    const withinRadius = candidates.filter(p => p.distance <= radiusKm * 1.5);
    if (withinRadius.length > 0) {
      return withinRadius.sort((a, b) => a.distance - b.distance);
    }
    // Fallback: nearest places in dataset
    return candidates.sort((a, b) => a.distance - b.distance).slice(0, 10);
  }

  async function geocodeAddress(query) {
    if (!query || !query.trim()) return null;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'id,en', 'User-Agent': 'TerserahApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), displayName: data[0].display_name };
        }
      }
    } catch {}

    const places = await loadOfflinePlaces();
    const qLower = query.toLowerCase();
    const found = places.find(p => p.address.toLowerCase().includes(qLower) || p.name.toLowerCase().includes(qLower));
    if (found) {
      return { lat: found.lat, lon: found.lon, displayName: found.address };
    }
    return null;
  }

  async function reverseGeocodeLatLng(lat, lon) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'id,en', 'User-Agent': 'TerserahApp/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data && data.display_name) return data.display_name;
      }
    } catch {}
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }

  /* ============================================================
     5. Leaflet Map Controller
     ============================================================ */
  let map = null;
  let userMarker = null;
  let radiusCircle = null;
  let resultMarker = null;
  let poolLayerGroup = null;
  let onMapClickCallback = null;

  function getUserIcon() {
    return L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 22px; height: 22px;">
          <div style="
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: rgba(249, 115, 22, 0.35);
            animation: pulseMarker 1.8s ease-out infinite;
          "></div>
          <div style="
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #f97316;
            border: 3px solid #090a0f;
            box-shadow: 0 0 14px rgba(249, 115, 22, 0.7);
          "></div>
        </div>
      `,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }

  function getResultIcon() {
    return L.divIcon({
      className: 'custom-result-marker',
      html: `
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #090a0f;
          border: 2px solid #f97316;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          transform: translateY(-8px);
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">🎲</div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }

  function getPoolPinIcon(emoji = '📍') {
    return L.divIcon({
      className: 'custom-pool-marker',
      html: `
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #141721;
          border: 1.5px solid #2b2f3d;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        ">${emoji}</div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function getZoomForRadius(km) {
    if (km <= 1.5) return 15;
    if (km <= 3) return 14;
    if (km <= 6) return 13;
    if (km <= 12) return 12;
    if (km <= 20) return 11;
    return 10;
  }

  function initMap(onMapClick) {
    if (typeof L === 'undefined') {
      console.error('Leaflet library belum termuat.');
      return null;
    }

    onMapClickCallback = onMapClick;
    const container = document.getElementById('map');
    if (!container) return null;

    if (map) {
      try { map.remove(); } catch {}
    }

    map = L.map('map', {
      center: [-6.2088, 106.8456],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Basemap Tile Layer
    // 1. Optional CARTO Dark Matter if user sets an API key:
    const cartoApiKey = (typeof window !== 'undefined' && window.CARTO_API_KEY) || localStorage.getItem('carto_api_key');

    if (cartoApiKey) {
      L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/dark_matter/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(cartoApiKey)}`, {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>',
      }).addTo(map);
    } else {
      // 2. Default: Esri World Dark Gray Canvas (Base + Reference)
      // 100% Free & Open (No API Key required)
      // Fully compatible with file:/// protocol, local server, & GitHub Pages
      // (OpenStreetMap Foundation blocks file:/// requests with 403 Access Blocked due to missing Referer)
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 16,
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        className: 'dark-tiles',
      }).addTo(map);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 16,
        maxZoom: 19,
        className: 'dark-tiles',
      }).addTo(map);
    }

    poolLayerGroup = L.layerGroup().addTo(map);

    map.on('click', (e) => {
      if (onMapClickCallback) {
        onMapClickCallback(e.latlng.lat, e.latlng.lng);
      }
    });

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 200);

    window.addEventListener('resize', () => {
      if (map) map.invalidateSize();
    });

    return map;
  }

  function setUserLocation(lat, lon, radiusKm) {
    if (!map) return;
    if (userMarker) userMarker.remove();
    if (radiusCircle) radiusCircle.remove();

    userMarker = L.marker([lat, lon], {
      icon: getUserIcon(),
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup('<div class="popup-title">Titik Acuan</div><div class="popup-desc">Klik di mana saja pada peta untuk geser titik acuan</div>');

    radiusCircle = L.circle([lat, lon], {
      radius: radiusKm * 1000,
      color: '#f97316',
      fillColor: '#f97316',
      fillOpacity: 0.08,
      weight: 1.5,
      dashArray: '5, 5',
    }).addTo(map);

    map.setView([lat, lon], getZoomForRadius(radiusKm));
    map.invalidateSize();
  }

  function updateRadius(radiusKm) {
    if (radiusCircle) {
      radiusCircle.setRadius(radiusKm * 1000);
      if (userMarker) {
        const latlng = userMarker.getLatLng();
        map.setView(latlng, getZoomForRadius(radiusKm));
      }
    }
  }

  function showResultOnMap(place) {
    if (!map) return;
    if (resultMarker) resultMarker.remove();

    resultMarker = L.marker([place.lat, place.lon], {
      icon: getResultIcon(),
      zIndexOffset: 2000,
    })
      .addTo(map)
      .bindPopup(`
        <div class="popup-title">${escapeHtml(place.name)}</div>
        <div class="popup-desc">${place.distance != null ? place.distance.toFixed(1) + ' km dari titik acuan' : ''}</div>
      `)
      .openPopup();

    map.flyTo([place.lat, place.lon], 16, { duration: 1.2, easeLinearity: 0.3 });
  }

  function clearResultMarker() {
    if (resultMarker) {
      resultMarker.remove();
      resultMarker = null;
    }
  }

  function renderPoolPins(places, onPlaceClick, categoryEmojis = {}) {
    if (!poolLayerGroup) return;
    poolLayerGroup.clearLayers();
    if (!places || places.length === 0) return;

    places.forEach((place) => {
      const emoji = categoryEmojis[place.category]?.emoji || '📍';
      const marker = L.marker([place.lat, place.lon], {
        icon: getPoolPinIcon(emoji),
        zIndexOffset: 500,
      });

      marker.bindPopup(`
        <div style="min-width: 140px; padding: 2px;">
          <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px; color: #f8fafc;">${escapeHtml(place.name)}</div>
          <div style="font-size: 0.75rem; color: #94a3b8; margin-bottom: 8px;">${place.distance ? place.distance.toFixed(1) + ' km' : ''}</div>
          <button class="btn-popup-view" style="
            width: 100%;
            padding: 5px 8px;
            border-radius: 6px;
            border: 1px solid #f97316;
            background: #f97316;
            color: #090a0f;
            font-size: 0.75rem;
            font-weight: 700;
            cursor: pointer;
          ">Lihat Tempat</button>
        </div>
      `);

      marker.on('popupopen', () => {
        const btn = document.querySelector('.btn-popup-view');
        if (btn) {
          btn.onclick = () => {
            if (onPlaceClick) onPlaceClick(place);
          };
        }
      });

      poolLayerGroup.addLayer(marker);
    });
  }

  function clearPoolPins() {
    if (poolLayerGroup) poolLayerGroup.clearLayers();
  }

  /* ============================================================
     6. UI & Drawers
     ============================================================ */
  function showToast(message, type = '', duration = 3000) {
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

  function showLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.hidden = false;
  }

  function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.hidden = true;
  }

  function updatePoolIndicator(count) {
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

  function showResultCard(place) {
    _currentPlace = place;
    const overlay = document.getElementById('result-overlay');
    if (!overlay) return;

    const catInfo = CATEGORY_LABELS[place.category] || { emoji: '📍', label: place.category };
    const budgetInfo = BUDGET_LABELS[place.budgetTier] || { label: 'Sedang', icon: '💵', range: 'Rp 30rb - 100rb' };

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
    if (badgeEl) badgeEl.textContent = `${catInfo.emoji} ${catInfo.label}`;

    const nameEl = document.getElementById('result-name');
    if (nameEl) animateDecryptedText(nameEl, place.name);

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

    const mapsHref = place.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`;
    const wazeHref = `https://waze.com/ul?ll=${place.lat},${place.lon}&navigate=yes`;

    const mapsBtn = document.getElementById('btn-maps');
    const wazeBtn = document.getElementById('btn-waze');
    if (mapsBtn) mapsBtn.href = mapsHref;
    if (wazeBtn) wazeBtn.href = wazeHref;

    updateSaveBtn(place.id);
    overlay.hidden = false;
  }

  function hideResultCard() {
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

  function initResultCardEvents() {
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
        const text = `Rekomendasi tempat dari Terserah: ${_currentPlace.name} (⭐ ${_currentPlace.rating || 4.5}) di ${_currentPlace.address}.`;
        const url = _currentPlace.googleMapsUrl || window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title: _currentPlace.name, text, url });
          } catch {}
        } else {
          try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            showToast('Tautan dan informasi tempat disalin ke clipboard!', 'success');
          } catch {
            showToast('Gagal menyalin tautan.', 'error');
          }
        }
      });
    }
  }

  function refreshWishlistBadge() {
    const badge = document.getElementById('wishlist-badge');
    if (!badge) return;
    const count = getWishlist().length;
    if (count > 0) {
      badge.textContent = count;
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function initWishlistDrawer(onSelectPlace) {
    const btnWish = document.getElementById('btn-wishlist');
    const overlay = document.getElementById('wishlist-overlay');
    const closeBtn = document.getElementById('close-wishlist');
    const backdrop = document.getElementById('wishlist-backdrop');
    const listEl = document.getElementById('wishlist-list');
    const footerEl = document.getElementById('wishlist-footer');
    const clearBtn = document.getElementById('btn-clear-wishlist');

    function renderList() {
      const list = getWishlist();
      listEl.innerHTML = '';
      if (list.length === 0) {
        listEl.innerHTML = '<p class="empty-state">Koleksi tersimpan masih kosong.</p>';
        footerEl.hidden = true;
        return;
      }
      footerEl.hidden = false;
      list.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'drawer-item';
        item.innerHTML = `
          <div style="flex: 1; cursor: pointer;">
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem;">${escapeHtml(p.name)}</div>
            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">⭐ ${p.rating || 4.5} · ${escapeHtml(p.address)}</div>
          </div>
          <button class="action-btn-del" style="background: none; border: none; color: #ef4444; font-size: 1rem; cursor: pointer; padding: 4px;" title="Hapus">✕</button>
        `;
        item.querySelector('div').onclick = () => {
          overlay.hidden = true;
          if (onSelectPlace) onSelectPlace(p);
        };
        item.querySelector('.action-btn-del').onclick = (e) => {
          e.stopPropagation();
          removeFromWishlist(p.id);
          renderList();
          refreshWishlistBadge();
          if (_currentPlace && _currentPlace.id === p.id) {
            updateSaveBtn(p.id);
          }
        };
        listEl.appendChild(item);
      });
    }

    if (btnWish) {
      btnWish.addEventListener('click', () => {
        renderList();
        overlay.hidden = false;
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => { overlay.hidden = true; });
    if (backdrop) backdrop.addEventListener('click', () => { overlay.hidden = true; });
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearWishlist();
        renderList();
        refreshWishlistBadge();
        showToast('Koleksi dibersihkan.');
      });
    }
  }

  function initHistoryDrawer(onSelectPlace) {
    const btnHist = document.getElementById('btn-history');
    const overlay = document.getElementById('history-overlay');
    const closeBtn = document.getElementById('close-history');
    const backdrop = document.getElementById('history-backdrop');
    const listEl = document.getElementById('history-list');
    const footerEl = document.getElementById('history-footer');
    const clearBtn = document.getElementById('btn-clear-history');

    function renderList() {
      const list = getHistory();
      listEl.innerHTML = '';
      if (list.length === 0) {
        listEl.innerHTML = '<p class="empty-state">Belum ada riwayat rekomendasi.</p>';
        footerEl.hidden = true;
        return;
      }
      footerEl.hidden = false;
      list.forEach((p) => {
        const item = document.createElement('div');
        item.className = 'drawer-item';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <div>
            <div style="font-weight: 700; color: #f8fafc; font-size: 0.92rem;">${escapeHtml(p.name)}</div>
            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">⭐ ${p.rating || 4.5} · ${escapeHtml(p.address)}</div>
          </div>
        `;
        item.onclick = () => {
          overlay.hidden = true;
          if (onSelectPlace) onSelectPlace(p);
        };
        listEl.appendChild(item);
      });
    }

    if (btnHist) {
      btnHist.addEventListener('click', () => {
        renderList();
        overlay.hidden = false;
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', () => { overlay.hidden = true; });
    if (backdrop) backdrop.addEventListener('click', () => { overlay.hidden = true; });
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearHistory();
        renderList();
        showToast('Riwayat dibersihkan.');
      });
    }
  }

  /* ============================================================
     7. Application Controller & State
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
  };

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

  const btnDatabase      = $('btn-database');
  const dataModal        = $('database-modal');
  const dataBackdrop     = $('database-backdrop');
  const dataClose        = $('database-close');
  const statTotalPlaces  = $('stat-total-places');
  const statCatBreakdown = $('stat-cat-breakdown');
  const btnReloadData    = $('btn-reload-data');

  async function syncDatabaseInfoUI() {
    const stats = await getDatabaseStats();
    if (statTotalPlaces) statTotalPlaces.textContent = `${stats.total} tempat`;
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
        showToast(`Database dimuat ulang (${places.length} tempat)`, 'success');
        closeDatabaseModal();
      } catch {
        showToast('Gagal memuat ulang data.', 'error');
      } finally {
        hideLoading();
      }
    });
  }

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
    fetchAndFilterPool();
  }

  function handleMapClick(lat, lon) {
    clearResultMarker();
    hideResultCard();
    setLocation(lat, lon);
    showToast('Titik acuan dipindahkan.', 'info');
  }

  if (btnSearchLoc) {
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
      } catch {
        showToast('Gagal mencari lokasi.', 'error');
      } finally {
        hideLoading();
      }
    });
  }

  if (inputLocation) {
    inputLocation.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnSearchLoc.click();
      }
    });
  }

  if (btnDetectLoc) {
    btnDetectLoc.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Peramban tidak mendukung GPS.', 'error');
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
  }

  if (sliderRadius) {
    sliderRadius.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.radiusKm = val;
      if (radiusValue) radiusValue.textContent = val;
      updateRadius(val);
    });
    sliderRadius.addEventListener('change', () => {
      fetchAndFilterPool();
    });
  }

  if (categoryChips) {
    categoryChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      categoryChips.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.categories = [btn.dataset.value];
      fetchAndFilterPool();
    });
  }

  if (budgetChips) {
    budgetChips.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-chip');
      if (!btn) return;
      budgetChips.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.budget = btn.dataset.value;
      fetchAndFilterPool();
    });
  }

  if (sliderRating) {
    sliderRating.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.minRating = val;
      if (ratingValue) ratingValue.textContent = `${val.toFixed(1)} ⭐`;
    });
    sliderRating.addEventListener('change', () => {
      fetchAndFilterPool();
    });
  }

  let foodDebounce = null;
  if (inputFoodQuery) {
    inputFoodQuery.addEventListener('input', (e) => {
      state.foodQuery = e.target.value;
      clearTimeout(foodDebounce);
      foodDebounce = setTimeout(() => {
        fetchAndFilterPool();
      }, 450);
    });
  }

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

  function displayPlace(place) {
    state.lastPickedId = place.id;
    addToHistory(place);
    showResultOnMap(place);
    showResultCard(place);
    if (btnReroll) btnReroll.hidden = state.pool.length <= 1;
  }

  function pickRandomAndShow() {
    const picked = pickRandom(state.pool, state.lastPickedId);
    if (!picked) {
      showToast('Tidak ada tempat yang cocok dengan kriteria saat ini. Coba perbesar radius atau turunkan rating.', 'info');
      return;
    }
    displayPlace(picked);
  }

  if (btnSurprise) {
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
        showToast('Belum ada tempat di radius ini. Coba geser peta ke area lain atau perkecil filter.', 'info');
      }
      btnSurprise.disabled = false;
    });
  }

  if (btnReroll) {
    btnReroll.addEventListener('click', () => {
      if (state.pool.length === 0) return;
      hideResultCard();
      showLoading();
      setTimeout(() => {
        hideLoading();
        pickRandomAndShow();
      }, 250);
    });
  }

  async function boot() {
    initClickSpark({ sparkColor: '#f97316', sparkSize: 10, sparkCount: 8 });
    initSpotlightCards('.spotlight-card');
    initMagnet('.magnet-btn', 0.22);

    initResultCardEvents();
    initWishlistDrawer((selectedPlace) => { displayPlace(selectedPlace); });
    initHistoryDrawer((selectedPlace) => { displayPlace(selectedPlace); });
    refreshWishlistBadge();

    // 1. Initialize Map
    initMap(handleMapClick);

    // 2. Load places in background
    await loadOfflinePlaces();
    syncDatabaseInfoUI();

    // 3. Set default location
    await setLocation(state.lat, state.lon, 'Jakarta Pusat');

    // 4. Try browser geolocation
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
