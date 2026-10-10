const CACHE_NAME = 'ecopontos-belem-v3';
const APP_ROOT = new URL('./', self.location.href).pathname;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/data.js',
  './js/app.js',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];
const DATA_PATH = new URL('./js/data.js', self.location.href).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('ecopontos-belem-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin || !requestUrl.pathname.startsWith(APP_ROOT)) return;

  if (requestUrl.pathname === DATA_PATH) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          throw new Error('Dados de locais indisponíveis: conexão e cópia offline ausentes.');
        })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedPage = await caches.match('./index.html');
        if (cachedPage) return cachedPage;
        throw new Error('Página indisponível: conexão e cópia offline ausentes.');
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
        if (response.ok && requestUrl.pathname.startsWith(APP_ROOT)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      throw new Error('Recurso indisponível: conexão e cópia offline ausentes.');
    })
  );
});
