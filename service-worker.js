const CACHE_NAME = 'bingobala-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './pdf-generator.html',
  './style.css',
  './bingo.js',
  './pdf-generator.js',
  './manifest.webmanifest',
  './offline.html',
  './assets/icon-192.svg',
  './assets/icon-512.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-1024.png',
  './fonts/DejaVuSans.ttf',
  './fonts/DejaVuSans-Bold.ttf',
  './presets/band_texts.json',
  './presets/band_texts_valentine.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(request.url);
  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          }).catch(() => {});

          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('./offline.html');
          }

          if (APP_SHELL.includes(request.url.replace(self.location.origin + '/', './'))) {
            return caches.match(request);
          }

          return caches.match('./offline.html');
        });
    })
  );
});
