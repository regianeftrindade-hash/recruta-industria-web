import * as Sentry from "@sentry/nextjs";
import { isSentryConfigured } from "@/lib/observability/report-error";

export async function register() {
  if (!isSentryConfigured()) return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

/** Hook do Next.js; sem DSN o SDK trata como no-op após register() pular o init. */
export const onRequestError = Sentry.captureRequestError;
