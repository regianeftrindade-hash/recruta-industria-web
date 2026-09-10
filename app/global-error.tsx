"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#3A3A3A",
          color: "#F2F2F2",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ color: "#C89B3C", fontSize: 22, margin: "0 0 12px" }}>
            Algo deu errado
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: 14, lineHeight: 1.5, color: "#ddd" }}>
            Não conseguimos carregar esta página. Tente de novo. Se o problema
            continuar, volte mais tarde ou fale com o suporte.
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
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
