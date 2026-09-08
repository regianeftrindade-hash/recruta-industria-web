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

export const onRequestError = Sentry.captureRequestError;
