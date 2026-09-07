"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getIsIos, getIsStandalone } from "@/lib/pwa/install-utils";
import IosInstallModal from "./IosInstallModal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptContextValue = {
  canNativeInstall: boolean;
  isIos: boolean;
  isInstalled: boolean;
  /** Exibir CTA quando ainda não instalado e há prompt nativo ou é iOS. */
  showPrompt: boolean;
  install: () => Promise<void>;
  iosModalOpen: boolean;
  openIosInstructions: () => void;
  closeIosInstructions: () => void;
};

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null);

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [iosModalOpen, setIosModalOpen] = useState(false);

  useEffect(() => {
    setIsIos(getIsIos());
    setIsInstalled(getIsStandalone());

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIosModalOpen(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    const mq = window.matchMedia("(display-mode: standalone)");
    const onDisplayMode = () => setIsInstalled(getIsStandalone());
    mq.addEventListener("change", onDisplayMode);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      mq.removeEventListener("change", onDisplayMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (getIsIos()) {
      setIosModalOpen(true);
      return;
    }
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
  }, [deferredPrompt]);

  const value = useMemo<InstallPromptContextValue>(
    () => ({
      canNativeInstall: Boolean(deferredPrompt),
      isIos,
      isInstalled,
      showPrompt: !isInstalled && (Boolean(deferredPrompt) || isIos),
      install,
      iosModalOpen,
      openIosInstructions: () => setIosModalOpen(true),
      closeIosInstructions: () => setIosModalOpen(false),
    }),
    [deferredPrompt, install, iosModalOpen, isInstalled, isIos]
  );

  return (
    <InstallPromptContext.Provider value={value}>
      {children}
      {iosModalOpen && <IosInstallModal onClose={() => setIosModalOpen(false)} />}
    </InstallPromptContext.Provider>
  );
}

export function useInstallPrompt(): InstallPromptContextValue {
  const ctx = useContext(InstallPromptContext);
  if (!ctx) {
    throw new Error("useInstallPrompt deve ser usado dentro de InstallPromptProvider");
  }
  return ctx;
}
