"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { htmlLang, resolveLocale, textDirection, type SupportedLocale, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";

/**
 * Erros fatais do App Router. Com DSN na Vercel, o Sentry recebe o evento.
 * Sem DSN o SDK no cliente não envia (init condicional em instrumentation-client).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    Sentry.captureException(error);
    setLocale(resolveLocale(navigator.language));
  }, [error]);

  return (
    <html lang={htmlLang(locale)} dir={textDirection(locale)}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3E6C8",
          color: "#414141",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ color: "#C89B3C", fontSize: 22, margin: "0 0 12px" }}>
            {t("error.global.title", locale)}
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: "var(--dash-text, #414141)" }}>
            {t("error.global.body", locale)}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              background: "linear-gradient(180deg, #8D6B1F 0%, #C89B3C 45%, #A87E2E 100%)",
              color: "#000",
              border: "1px solid #6b5218",
              borderRadius: 8,
              padding: "12px 24px",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t("error.global.retry", locale)}
          </button>
        </div>
      </body>
    </html>
  );
}
