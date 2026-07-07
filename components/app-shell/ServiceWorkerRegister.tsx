"use client";

import { useEffect, useState } from "react";

let deferredPrompt: any = null;

export default function ServiceWorkerRegister() {
    const [canInstall, setCanInstall] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!("serviceWorker" in navigator)) return;

        const isProduction = process.env.NODE_ENV === "production";

        if (isProduction) {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("✗ Erro ao registrar SW", err);
            });
        } else {
            // Em desenvolvimento: desregistra qualquer SW já instalado
            // (evita servir versões antigas cacheadas) e limpa todos os caches.
            navigator.serviceWorker
                .getRegistrations()
                .then((registrations) => {
                    if (registrations.length > 0) {
                        console.info(
                            "🧹 Dev mode: desregistrando SW existente(s)",
                            registrations.length
                        );
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

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (process.env.NODE_ENV !== "production") return;

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            deferredPrompt = e;
            setCanInstall(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        deferredPrompt = null;
        setCanInstall(false);
    };

    if (!canInstall) return null;

    return (
        <div style={{ textAlign: "center", marginTop: 24 }}>
            <button
                onClick={installApp}
                style={{
                    background: "linear-gradient(180deg, #C89B3C 0%, #8D6B1F 100%)",
                    color: "#1F1F1F",
                    padding: "12px 20px",
                    border: "1px solid #C89B3C",
                    fontSize: 16,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    cursor: "pointer",
                }}
            >
                📲 Baixar aplicativo
            </button>
        </div>
    );
}
