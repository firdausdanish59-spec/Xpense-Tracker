// Xpense Service Worker — Auto-updating, Network-first for pages
const CACHE_VERSION = 'xpense-v2';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache core static assets, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.warn('SW cache addAll failed:', err))
  );
  // Activate new SW immediately — don't wait for old tabs to close
  self.skipWaiting();
});

// Activate: clean ALL old caches, take control of all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Take control of all open pages immediately (no refresh needed)
  self.clients.claim();
});

// Fetch strategy:
// - Navigation (HTML pages): Network-first, fall back to cache
// - Firebase/API calls: Always network (skip SW)
// - Static assets (JS, CSS, images): Stale-while-revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Firebase / external API calls — always go to network
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('firestore') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('fonts.googleapis') ||
    url.hostname.includes('fonts.gstatic')
  ) {
    return;
  }

  // Navigation requests (HTML pages) — Network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback: serve cached page
          return caches.match(request).then((cached) => {
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Static assets — Stale-while-revalidate
  // Serve from cache immediately, but fetch fresh copy in background
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => cached);

      // Return cached version immediately if available, otherwise wait for network
      return cached || networkFetch;
    })
  );
});
