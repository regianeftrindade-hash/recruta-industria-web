"use client";

import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export default function ServiceWorkerRegister() {
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // 1️⃣ Registrar Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("✓ Service Worker registrado", reg);
        })
        .catch((err) => {
          console.error("✗ Erro ao registrar SW", err);
        });
    }

    // 2️⃣ Capturar evento de instalação PWA
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      deferredPrompt = e;
      setCanInstall(true);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // 3️⃣ Disparar instalação
  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    setCanInstall(false);
  };

  // 4️⃣ Só mostra botão se puder instalar
  if (!canInstall) return null;

  return (
    <div style={{ textAlign: "center", marginTop: 24 }}>
      <button
        onClick={installApp}
        style={{
          background: "#2563eb",
          color: "#fff",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        📲 Baixar aplicativo
      </button>
    </div>
  );
}
