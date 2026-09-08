/**
 * Observabilidade opcional (Sentry).
 * Sem SENTRY_DSN: só loga no console — não quebra o app.
 * Com DSN: depois de `npm i @sentry/nextjs`, conecte o SDK aqui.
 */

type ReportContext = Record<string, unknown>;

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

  // Hook futuro: Sentry.captureException(error, { extra: context })
}

export function isSentryConfigured(): boolean {
  return Boolean(
    (typeof process !== "undefined" && process.env.SENTRY_DSN) ||
      (typeof process !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN),
  );
}
