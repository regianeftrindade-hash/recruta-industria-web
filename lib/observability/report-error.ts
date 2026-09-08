/**
 * Observabilidade opcional (Sentry).
 * Sem DSN: só loga no console.
 * Com SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN: envia para o Sentry.
 */

type ReportContext = Record<string, unknown>;

export function isSentryConfigured(): boolean {
  if (typeof process === "undefined") return false;
  const dsn =
    process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  return Boolean(dsn);
}

export function reportError(error: unknown, context?: ReportContext): void {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: context ?? {},
    at: new Date().toISOString(),
  };

  if (typeof console !== "undefined") {
    console.error("[observability]", payload);
  }

  if (!isSentryConfigured()) return;

  try {
    // Import dinâmico evita custo quando DSN não existe no cliente bundlado sem env.
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    });
  } catch {
    /* ignore */
  }
}
