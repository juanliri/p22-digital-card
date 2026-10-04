// P-22 Digital Business Card — Service Worker for Offline Resilience (v3.4 Titanium Edition)
const CACHE_NAME = 'p22-cache-v3.8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/badge.html',
  '/setup.html',
  '/manifest.json',
  '/manifest-badge.json',
  '/manifest-badge-pedro.json',
  '/manifest-badge-eduardo.json',
  '/manifest-badge-marleni.json',
  '/team.json',
  '/logo.webp',
  '/favicon.png',
  '/favicon.webp',
  '/favicon.ico',
  '/assets/staff/pedro-official-1x1.png',
  '/assets/staff/eduardo-official-1x1.png',
  '/assets/staff/marleni-official-1x1.png',
  '/assets/staff/bids-official-1x1.png',
  '/assets/staff/logistics-official-1x1.png',
  '/assets/staff/pedro-badge-icon-192.png',
  '/assets/staff/pedro-badge-icon-512.png',
  '/assets/staff/eduardo-badge-icon-192.png',
  '/assets/staff/eduardo-badge-icon-512.png',
  '/assets/staff/marleni-badge-icon-192.png',
  '/assets/staff/marleni-badge-icon-512.png',
  '/assets/branding/p22-official-logo.png',
  '/assets/branding/logo-navy-flat.png',
  '/assets/passes/pedro.pkpass',
  '/assets/passes/eduardo.pkpass',
  '/assets/passes/marleni.pkpass',
  '/assets/passes/bids.pkpass',
  '/assets/passes/logistics.pkpass',
  '/assets/vcf/pedro.vcf',
  '/assets/vcf/eduardo.vcf',
  '/assets/vcf/marleni.vcf',
  '/assets/vcf/bids.vcf',
  '/assets/vcf/logistics.vcf',
  '/assets/failsafe_lockscreen_pedro.png',
  '/assets/failsafe_lockscreen_eduardo.png',
  '/assets/failsafe_lockscreen_marleni.png',
  '/assets/failsafe_lockscreen_bids.png',
  '/assets/failsafe_lockscreen_logistics.png',
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
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
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
