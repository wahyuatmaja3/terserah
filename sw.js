const CACHE_NAME = 'terserah-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/api.js',
  './assets/js/filter.js',
  './assets/js/map.js',
  './assets/js/storage.js',
  './assets/js/ui.js',
  './assets/images/placeholder.svg',
  './manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always network-first for Overpass/Nominatim API calls
  if (url.hostname.includes('overpass') || url.hostname.includes('nominatim')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Cache-first for static assets, CDN tiles, Leaflet
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
