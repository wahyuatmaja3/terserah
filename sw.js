const CACHE_NAME = 'terserah-v6';

const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/app.bundle.js',
  './assets/data/places.js',
  './assets/js/app.js',
  './assets/js/api.js',
  './assets/js/filter.js',
  './assets/js/map.js',
  './assets/js/storage.js',
  './assets/js/ui.js',
  './assets/images/placeholder.svg',
  './manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do not intercept or cache external map tiles or OSM APIs
  if (
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('cartocdn.com') ||
    url.hostname.includes('overpass') ||
    url.hostname.includes('komoot.io') ||
    url.hostname.includes('cloudflare') ||
    url.hostname.includes('unpkg')
  ) {
    return;
  }

  // Network-first for local assets so updates are immediate
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
