"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { GOOGLE_ADS_ID } from "@/lib/analytics/google-ads";

/**
 * Não carrega o gtag na home (PageSpeed / JS não usado).
 * Nas demais rotas carrega em lazyOnload; conversões usam fila dataLayer.
 */
export default function GoogleAdsLoader() {
  const pathname = usePathname() || "/";
  if (pathname === "/") return null;

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
