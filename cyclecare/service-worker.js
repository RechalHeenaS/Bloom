/**
 * service-worker.js
 * Caches the app shell so Bloom keeps working offline. All user data lives
 * in localStorage on the client, not here — this only caches static files.
 * Bump CACHE_NAME whenever any cached file changes so old caches are dropped.
 */
const CACHE_NAME = 'bloom-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './mobile.css',
  './dark.css',
  './animations.css',
  './script.js',
  './storage.js',
  './theme.js',
  './cycle.js',
  './recommend.js',
  './calendar.js',
  './water.js',
  './mood.js',
  './symptoms.js',
  './notes.js',
  './foodlog.js',
  './checkin.js',
  './charts.js',
  './notification.js',
  './auth.js',
  './ui.js',
  './manifest.json',
  './icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Cache-first for app shell assets, falling back to network, and finally
// to the cached index.html for navigation requests (so deep refreshes work
// offline too).
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
