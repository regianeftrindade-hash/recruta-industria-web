// Service Worker do Recruta Indústria.
// Estratégia:
//  - HTML / navegações -> NETWORK-FIRST (sempre pega a versão atual do servidor;
//    cache serve apenas como fallback offline).
//  - Assets estáticos (imagens, manifest, favicon) -> cache-first.
//  - Dev/HMR do Next.js (/_next/, /api/) -> passa direto, não intercepta.
// Bump o CACHE_VERSION sempre que quiser invalidar o cache antigo de clientes já instalados.

const CACHE_VERSION = "v5-2026-07-05-ui";
const CACHE_NAME = `recruta-industria-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    "/manifest.json",
    "/favicon.ico",
    "/profissional.jpg",
    "/empresa.jpg",
    "/welding-left.jpg",
    "/welding-right.jpg",
    "/logo-r-transparent.png",
];

self.addEventListener("install", (event) => {
    // Ativa imediatamente sem esperar as abas antigas fecharem
    self.skipWaiting();
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS).catch(() => {}))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                )
            )
            // Assume o controle de todas as abas abertas imediatamente
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") return;

    let url;
    try {
        url = new URL(request.url);
    } catch (e) {
        return;
    }

    if (!url.protocol.startsWith("http")) return;

    // Não interceptar dev/HMR do Next.js nem APIs
    if (
        url.pathname.startsWith("/_next/") ||
        url.pathname.startsWith("/api/") ||
        url.pathname.includes("__nextjs") ||
        url.pathname.includes("hot-update")
    ) {
        return;
    }

    const acceptHeader = request.headers.get("accept") || "";
    const isNavigation =
        request.mode === "navigate" || acceptHeader.includes("text/html");

    if (isNavigation) {
        // NETWORK-FIRST para HTML: sempre buscar da rede primeiro,
        // cachear a resposta para fallback offline e servir do cache
        // apenas se a rede falhar.
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const cloned = response.clone();
                    caches
                        .open(CACHE_NAME)
                        .then((cache) => cache.put(request, cloned).catch(() => {}));
                    return response;
                })
                .catch(() =>
                    caches
                        .match(request)
                        .then(
                            (cached) =>
                                cached ||
                                caches.match("/") ||
                                new Response("Offline", { status: 503 })
                        )
                )
        );
        return;
    }

    // CACHE-FIRST para assets estáticos (imagens, css, fontes, etc.)
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request)
                .then((response) => {
                    if (response.ok && url.origin === self.location.origin) {
                        const cloned = response.clone();
                        caches
                            .open(CACHE_NAME)
                            .then((cache) => cache.put(request, cloned).catch(() => {}));
                    }
                    return response;
                })
                .catch(() => cached || new Response("", { status: 504 }));
        })
    );
});
