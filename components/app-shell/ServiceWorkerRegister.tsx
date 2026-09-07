"use client";

import { useEffect } from "react";

/** Registra o service worker em produção; em dev remove SW e caches antigos. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("✗ Erro ao registrar SW", err);
      });
    } else {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            console.info("🧹 Dev mode: desregistrando SW existente(s)", registrations.length);
          }
          return Promise.all(registrations.map((r) => r.unregister()));
        })
        .then(() => {
          if ("caches" in window) {
            return caches.keys().then((names) =>
              Promise.all(
                names.map((name) => {
                  console.info("🧹 Dev mode: limpando cache", name);
                  return caches.delete(name);
                })
              )
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
