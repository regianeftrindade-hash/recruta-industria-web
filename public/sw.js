const CACHE_NAME = 'recruta-industria-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instalar service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.error('Erro ao cachear:', err))
  );
  self.skipWaiting();
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceptar requisições - Network First
self.addEventListener('fetch', (event) => {
  // Apenas GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Para URLs dinâmicas (APIs), tentar rede primeiro
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return caches.match(event.request);
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).catch(() => 
            new Response('Offline - sem cache disponível')
          );
        })
    );
    return;
  }

  // Para assets estáticos, cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            return new Response('Offline', { status: 503 });
          });
      })
  );
});
