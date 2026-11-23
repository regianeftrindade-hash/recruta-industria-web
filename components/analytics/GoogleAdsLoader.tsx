"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GOOGLE_ADS_ID } from "@/lib/analytics/google-ads";
import {
  marketingConsentGranted,
  readBrowserCookieConsent,
  type CookieConsentLevel,
} from "@/lib/privacy/cookie-consent";

/**
 * Carrega gtag apenas com consentimento de marketing e fora da home.
 * Sem opt-in, nenhum script do Google Ads é injetado.
 */
export default function GoogleAdsLoader() {
  const pathname = usePathname() || "/";
  const [consent, setConsent] = useState<CookieConsentLevel | null>(null);

  useEffect(() => {
    setConsent(readBrowserCookieConsent());
    function onConsent(event: Event) {
      const detail = (event as CustomEvent<{ level?: CookieConsentLevel }>).detail;
      if (detail?.level) setConsent(detail.level);
      else setConsent(readBrowserCookieConsent());
    }
    window.addEventListener("ri-cookie-consent", onConsent as EventListener);
    return () => window.removeEventListener("ri-cookie-consent", onConsent as EventListener);
  }, []);

  if (pathname === "/") return null;
  if (!marketingConsentGranted(consent)) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-ads-gtag" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
