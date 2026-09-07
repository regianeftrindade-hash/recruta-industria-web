// Service Worker do Recruta Indústria — permanece ativo para o Chrome
// instalar o app de verdade (WebAPK na lista de aplicativos).
// Rede direta: não guarda CSS/JS em cache (evita tela antiga após atualizar).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const names = await caches.keys();
        await Promise.all(names.map((name) => caches.delete(name)));
      } catch {
        /* ignore */
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request).catch(
      () => new Response("", { status: 504, statusText: "Offline" }),
    ),
  );
});
