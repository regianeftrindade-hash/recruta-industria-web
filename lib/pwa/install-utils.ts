/** Detecta iPhone/iPad (Safari) — não dispara beforeinstallprompt. */
export function getIsIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

export function getIsAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(window.navigator.userAgent);
}

/** App já aberto em modo instalado (ícone na lista de aplicativos). */
export function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    ("standalone" in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function getAndroidStoreUrl(): string {
  return (process.env.NEXT_PUBLIC_ANDROID_APP_URL || "").trim();
}

export function getIosStoreUrl(): string {
  return (process.env.NEXT_PUBLIC_IOS_APP_URL || "").trim();
}

export function getAndroidApkUrl(): string {
  return (process.env.NEXT_PUBLIC_ANDROID_APK_URL || "").trim();
}
