const CACHE_NAME = 'cineflix-v1';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install SW
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activate worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate SW
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch Strategy: Network First, fallback to cache
// We use Network First because this is a streaming app; content changes frequently.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});