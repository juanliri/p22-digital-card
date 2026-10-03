// P-22 Digital Business Card — Service Worker for Expo Floor Offline Resilience
const CACHE_NAME = 'p22-card-v1.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.webp',
  '/favicon.png',
  '/favicon.webp',
  '/favicon.ico',
  '/assets/staff/pedro-felipe.png',
  '/assets/staff/eduardo-lopez.jpg',
  '/assets/staff/marleni-bonilla.png',
  '/assets/staff/bids-desk.png',
  '/assets/facility/logistics-fleet.webp',
  '/assets/facility/loading-dock.webp',
  '/assets/facility/warehouse-forklift.webp',
  '/assets/facility/construction-crane.webp',
  '/assets/pdf/P22-Capability-Statement-Official.pdf',
  '/assets/pdf/P-22_Corporate_Overview.pdf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Non-blocking caching of static assets
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[P22-SW] Pre-caching partial fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip chrome extensions, non-GET, and analytics
  if (req.method !== 'GET' || url.protocol === 'chrome-extension:' || url.pathname.includes('/_vercel/')) {
    return;
  }

  // HTML Navigation: Network-First with Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/index.html') || caches.match('/')))
    );
    return;
  }

  // Static Assets (Images, PDFs, Scripts): Cache-First with Network Revalidation
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously update cache in background
        fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(req, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback for images
        if (req.headers.get('accept')?.includes('image')) {
          return caches.match('/logo.webp');
        }
      });
    })
  );
});
