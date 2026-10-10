// Service Worker - PRACI SIAGA
// Caching untuk akses offline nomor darurat

const CACHE_NAME = 'praci-siaga-v37';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/app.js',
  './manifest.json',
  './assets/logo.jpg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/logo-prabu.png',
  './assets/cs-service.png',
  './assets/pin-lokasi.png',
  './assets/centang-hijau.png',
  './assets/telepon.png',
  './assets/damkar.png',
  './assets/puskesmas.png',
  './assets/bpbd.png',
  './assets/sar.png',
  './assets/icons/sar-search.png',
  './assets/icons/sar-rescue.png',
  './assets/dishub.png',
  './assets/pmi.png',
  './assets/polda-jateng.png',
  './assets/banners/banner-1.png',
  './assets/banners/banner-2.jpg',
  './assets/banners/banner-3.jpg',
  './assets/banners/banner-4.jpg',
  './assets/banners/banner-5.jpg',
  './assets/banners/banner-6.jpg',
  './assets/banners/banner-7.png',
  './assets/banners/banner-prabu.png',
];

// Install: Cache semua aset utama
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Hapus cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Network first untuk navigasi HTML, fallback ke cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Navigasi HTML: Network first
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Aset statis: Cache first dengan background network update
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkRes.clone()));
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
