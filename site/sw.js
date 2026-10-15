// Offline PWA service worker with Stale-While-Revalidate caching for Appshell Store
const CACHE_NAME = 'appshell-store-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './store.css',
  './store.js',
  './mark.svg',
  './config.json',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Always fetch dynamic catalog/listings from network/CDN so data changes are detected immediately
  const isDynamicData = url.pathname.endsWith('index.json') ||
                        url.pathname.endsWith('apps.json') ||
                        url.pathname.endsWith('config.json');
  if (isDynamicData) return;

  // Cache same-origin assets and CDN assets (jsdelivr, fonts)
  const isCachable = url.origin === self.location.origin ||
                     url.hostname === 'cdn.jsdelivr.net' ||
                     url.hostname === 'fonts.googleapis.com' ||
                     url.hostname === 'fonts.gstatic.com';

  if (!isCachable) return;

  // Stale-While-Revalidate: Return cached response immediately while revalidating in background
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => null);

      return cached || (await networkPromise) || new Response('', { status: 504, statusText: 'Gateway Timeout' });
    })
  );
});
