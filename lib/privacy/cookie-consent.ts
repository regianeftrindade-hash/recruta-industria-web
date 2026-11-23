/**
 * Consentimento de cookies (primeiro partido).
 * - essential: sessão, idioma, segurança
 * - marketing: Google Ads / gtag (opt-in)
 */

export const COOKIE_CONSENT_NAME = "ri_cookie_consent";
export const COOKIE_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 dias

export type CookieConsentLevel = "essential" | "marketing";

export function parseCookieConsent(raw: string | null | undefined): CookieConsentLevel | null {
  const value = String(raw || "").trim().toLowerCase();
  if (value === "essential" || value === "marketing") return value;
  return null;
}

export function marketingConsentGranted(level: CookieConsentLevel | null): boolean {
  return level === "marketing";
}

/** Lê o cookie no browser (cliente). */
export function readBrowserCookieConsent(): CookieConsentLevel | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_CONSENT_NAME}=`));
  if (!match) return null;
  return parseCookieConsent(decodeURIComponent(match.split("=").slice(1).join("=")));
}

export function writeBrowserCookieConsent(level: CookieConsentLevel): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_CONSENT_NAME}=${encodeURIComponent(level)}; Path=/; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}
