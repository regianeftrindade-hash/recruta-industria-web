"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("✓ Service Worker registrado"))
        .catch((err) => console.log("Service Worker erro:", err));
    }
  }, []);

  return null;
}
