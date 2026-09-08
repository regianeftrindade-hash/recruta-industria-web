import { isSentryConfigured } from "@/lib/observability/report-error";

/**
 * Next.js instrumentation — carrega hooks de runtime.
 * Sentry só ativa quando houver DSN (evita dependência obrigatória no build).
 */
export async function register() {
  if (!isSentryConfigured()) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.info(
      "[observability] SENTRY_DSN definido. Instale @sentry/nextjs e ligue o SDK em lib/observability/report-error.ts para enviar erros.",
    );
  }
}
