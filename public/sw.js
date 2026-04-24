const CACHE_NAME = 'xpense-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-First for HTML, Cache-First for static assets
self.addEventListener('fetch', (event) => {
  // Skip Firebase API calls — always fetch live
  if (event.request.url.includes('firebase') ||
      event.request.url.includes('firestore') ||
      event.request.url.includes('googleapis') ||
      event.request.url.includes('identitytoolkit')) {
    return;
  }

  // Network-First strategy for HTML and navigation requests
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Cache-First strategy for other assets (JS, CSS, images)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Ignore errors for non-document requests as there's no suitable offline fallback
        });
    })
  );
});
