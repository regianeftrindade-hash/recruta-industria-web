// Service Worker do Recruta Indústria — MODO KILL (12/07/2026).
//
// O SW anterior fazia cache-first de assets, o que fazia o navegador
// servir CSS/JS antigos mesmo em desenvolvimento (moldura dourada,
// títulos e outras alterações do tema não apareciam depois de refresh).
//
// Este arquivo agora:
//   1. Assume o controle imediatamente (skipWaiting + clients.claim);
//   2. Apaga TODAS as caches criadas pelas versões antigas do SW;
//   3. Desregistra a si mesmo;
//   4. Recarrega as abas abertas para que passem a buscar direto da rede.
//
// Depois que todos os clientes ativos executarem este SW pelo menos uma
// vez, ele deixa de existir no navegador e nenhuma resposta é servida
// mais a partir do cache antigo.

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            try {
                const names = await caches.keys();
                await Promise.all(names.map((name) => caches.delete(name)));
            } catch (_) {
                /* ignore */
            }

            try {
                await self.registration.unregister();
            } catch (_) {
                /* ignore */
            }

            try {
                const clients = await self.clients.matchAll({ type: "window" });
                for (const client of clients) {
                    try {
                        client.navigate(client.url);
                    } catch (_) {
                        /* ignore */
                    }
                }
            } catch (_) {
                /* ignore */
            }
        })()
    );
});

self.addEventListener("fetch", () => {
    // Não intercepta nada — deixa o navegador ir direto na rede.
    return;
});
