"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n/translate";
import {
  COOKIE_CONSENT_NAME,
  type CookieConsentLevel,
  readBrowserCookieConsent,
  writeBrowserCookieConsent,
} from "@/lib/privacy/cookie-consent";

/**
 * Banner mínimo: essenciais sempre; marketing (Google Ads) só com opt-in.
 * Dispara evento para o GoogleAdsLoader reagir sem reload.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readBrowserCookieConsent() == null);
    function onReopen() {
      setVisible(true);
    }
    window.addEventListener("ri-open-cookie-settings", onReopen);
    return () => window.removeEventListener("ri-open-cookie-settings", onReopen);
  }, []);

  function choose(level: CookieConsentLevel) {
    writeBrowserCookieConsent(level);
    setVisible(false);
    try {
      window.dispatchEvent(
        new CustomEvent("ri-cookie-consent", { detail: { level } }),
      );
    } catch {
      // ignore
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("privacy.cookieBannerTitle")}
      aria-describedby="ri-cookie-consent-desc"
      style={{
        position: "fixed",
        zIndex: 10000,
        left: 12,
        right: 12,
        bottom: 12,
        maxWidth: 560,
        margin: "0 auto",
        padding: "14px 16px",
        borderRadius: 12,
        background: "#F3E6C8",
        border: "1px solid rgba(141, 107, 31, 0.7)",
        color: "#414141",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      <p id="ri-cookie-consent-desc" style={{ margin: "0 0 10px", fontSize: "0.86rem", lineHeight: 1.45 }}>
        {t("privacy.cookieBannerBody")}{" "}
        <Link href="/termos/privacidade" style={{ color: "#414141" }}>
          {t("legal.linkPrivacy")}
        </Link>
        .
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button
          type="button"
          onClick={() => choose("essential")}
          style={{
            flex: "1 1 140px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "2px solid #8D6B1F",
            background: "#E8D5A3",
            color: "#414141",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("privacy.cookieEssentialOnly")}
        </button>
        <button
          type="button"
          onClick={() => choose("marketing")}
          data-consent={COOKIE_CONSENT_NAME}
          style={{
            flex: "1 1 140px",
            padding: "10px 12px",
            borderRadius: 8,
            border: "2px solid #8D6B1F",
            background: "#D4AF37",
            color: "#414141",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {t("privacy.cookieAcceptMarketing")}
        </button>
      </div>
    </div>
  );
}
