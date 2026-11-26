import { scrubSentryEvent } from "@/lib/observability/sentry-privacy";

/**
 * Baseline de coleta alinhada ao v10 com `sendDefaultPii: false`.
 * No Sentry JS v11 o default de `dataCollection` é permissivo — manter explícito.
 */
export const SENTRY_RESTRICTED_DATA_COLLECTION = {
  userInfo: false,
  cookies: false,
  httpHeaders: {
    request: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    response: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
  },
  httpBodies: [] as string[],
  urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
} as const;

type SentryLikeInitOptions = {
  dsn: string;
  enabled: boolean;
  tracesSampleRate: number;
  environment?: string;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  /** @deprecated removido no Sentry JS v11 — preferir dataCollection */
  sendDefaultPii?: boolean;
  dataCollection?: typeof SENTRY_RESTRICTED_DATA_COLLECTION;
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
    // v11: default permissivo — restringir explicitamente (equivalente ao sendDefaultPii:false do v10)
    dataCollection: SENTRY_RESTRICTED_DATA_COLLECTION,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  };
}
