import * as Sentry from "@sentry/nextjs";
import { buildSentryPrivacyOptions } from "@/lib/observability/sentry-options";

const dsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim();

// Sem DSN: não inicializa — evita envio e não quebra o bundle.
if (dsn) {
  Sentry.init(
    buildSentryPrivacyOptions({
      dsn,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.1,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
    }) as Parameters<typeof Sentry.init>[0],
  );
}
