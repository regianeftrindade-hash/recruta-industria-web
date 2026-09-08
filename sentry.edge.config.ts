import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

// Sem DSN: não inicializa (app sobe normalmente).
if (!dsn) {
  // no-op
} else {
  Sentry.init({
    dsn,
    enabled: true,
    tracesSampleRate: 0.05,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  });
}
