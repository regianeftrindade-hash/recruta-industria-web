"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          console.log("✓ Service Worker registrado com sucesso", reg);
          // Verificar se está ativo
          if (reg.active) {
            console.log("✓ Service Worker está ativo");
          }
          if (reg.installing) {
            console.log("⏳ Service Worker está instalando...");
          }
          if (reg.waiting) {
            console.log("⏳ Service Worker está aguardando...");
          }
        })
        .catch((err) => {
          console.error("❌ Service Worker erro:", err);
        });
    } else {
      console.warn("⚠️ Service Worker não suportado neste navegador");
    }
  }, []);

  return null;
}
