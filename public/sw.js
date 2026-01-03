const CACHE_NAME = 'recruta-industria-v1';
const urlsToCache = [
  '/',
  '/professional/register',
  '/professional/checkout',
  '/login',
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

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Apenas GET
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se existe no cache, retornar
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then((response) => {
            // Não cachear requisições inválidas
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clonar response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Se falhar e não existir no cache, retornar página offline
            return caches.match('/offline.html').catch(() => new Response('Offline'));
          });
      })
  );
});
