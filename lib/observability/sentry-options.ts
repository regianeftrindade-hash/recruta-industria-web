import { scrubSentryEvent } from "@/lib/observability/sentry-privacy";

type SentryLikeInitOptions = {
  dsn: string;
  enabled: boolean;
  tracesSampleRate: number;
  environment?: string;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  sendDefaultPii?: boolean;
  beforeSend?: (event: Record<string, unknown>) => Record<string, unknown> | null;
};

/** Opções comuns de privacidade para Sentry (server/edge/client). */
export function buildSentryPrivacyOptions(base: {
  dsn: string;
  tracesSampleRate: number;
  environment?: string;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}): SentryLikeInitOptions {
  return {
    ...base,
    enabled: true,
    sendDefaultPii: false,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  };
}
