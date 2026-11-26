import * as Sentry from "@sentry/nextjs";
import { buildSentryPrivacyOptions } from "@/lib/observability/sentry-options";

const dsn =
  process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

// Sem DSN: não inicializa (app sobe normalmente).
if (!dsn) {
  // no-op
} else {
  Sentry.init(
    buildSentryPrivacyOptions({
      dsn,
      tracesSampleRate: 0.1,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    }) as Parameters<typeof Sentry.init>[0],
  );
}
