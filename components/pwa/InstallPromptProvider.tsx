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
import {
  getAndroidApkUrl,
  getAndroidStoreUrl,
  getIsAndroid,
  getIsIos,
  getIsStandalone,
  getIosStoreUrl,
} from "@/lib/pwa/install-utils";
import AndroidInstallModal from "./AndroidInstallModal";
import IosInstallModal from "./IosInstallModal";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallPromptContextValue = {
  canNativeInstall: boolean;
  isIos: boolean;
  isInstalled: boolean;
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
  const [androidModalOpen, setAndroidModalOpen] = useState(false);

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
      setAndroidModalOpen(false);
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
    const iosStore = getIosStoreUrl();
    const androidStore = getAndroidStoreUrl();
    const apkUrl = getAndroidApkUrl();

    if (getIsIos()) {
      if (iosStore) {
        window.location.assign(iosStore);
        return;
      }
      setIosModalOpen(true);
      return;
    }

    if (androidStore) {
      window.location.assign(androidStore);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      return;
    }

    if (apkUrl) {
      window.location.assign(apkUrl);
      return;
    }

    if (getIsAndroid()) {
      setAndroidModalOpen(true);
    }
  }, [deferredPrompt]);

  const value = useMemo<InstallPromptContextValue>(
    () => ({
      canNativeInstall: Boolean(deferredPrompt),
      isIos,
      isInstalled,
      showPrompt: !isInstalled,
      install,
      iosModalOpen,
      openIosInstructions: () => setIosModalOpen(true),
      closeIosInstructions: () => setIosModalOpen(false),
    }),
    [deferredPrompt, install, iosModalOpen, isInstalled, isIos],
  );

  return (
    <InstallPromptContext.Provider value={value}>
      {children}
      {iosModalOpen && <IosInstallModal onClose={() => setIosModalOpen(false)} />}
      {androidModalOpen && (
        <AndroidInstallModal
          apkUrl={getAndroidApkUrl() || undefined}
          onClose={() => setAndroidModalOpen(false)}
        />
      )}
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
