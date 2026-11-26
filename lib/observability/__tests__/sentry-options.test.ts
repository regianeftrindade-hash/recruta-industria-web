import { describe, expect, it } from "vitest";
import {
  buildSentryPrivacyOptions,
  SENTRY_RESTRICTED_DATA_COLLECTION,
} from "@/lib/observability/sentry-options";

describe("buildSentryPrivacyOptions (Sentry 11)", () => {
  it("define dataCollection restritiva (não herda default permissivo do v11)", () => {
    const opts = buildSentryPrivacyOptions({
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      tracesSampleRate: 0.1,
      environment: "test",
    });
    expect(opts.enabled).toBe(true);
    expect(opts.sendDefaultPii).toBeUndefined();
    expect(opts.dataCollection).toEqual(SENTRY_RESTRICTED_DATA_COLLECTION);
    expect(opts.dataCollection?.userInfo).toBe(false);
    expect(opts.dataCollection?.cookies).toBe(false);
    expect(opts.dataCollection?.httpBodies).toEqual([]);
    expect(opts.dataCollection?.databaseQueryData).toBe(false);
  });

  it("mantém beforeSend para scrubbing adicional", () => {
    const opts = buildSentryPrivacyOptions({
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      tracesSampleRate: 0.1,
    });
    expect(typeof opts.beforeSend).toBe("function");
    const scrubbed = opts.beforeSend?.({
      message: "falha user@example.com",
      user: { email: "user@example.com" },
    });
    expect(String(scrubbed?.message || "")).toContain("[redacted-email]");
  });
});
