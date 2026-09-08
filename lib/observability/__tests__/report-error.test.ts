import { describe, expect, it } from "vitest";
import { isSentryConfigured, reportError } from "@/lib/observability/report-error";

describe("observability scaffold", () => {
  it("reportError não lança", () => {
    expect(() => reportError(new Error("teste"), { rota: "/e2e" })).not.toThrow();
  });

  it("isSentryConfigured reflete env", () => {
    const prev = process.env.SENTRY_DSN;
    delete process.env.SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    expect(isSentryConfigured()).toBe(false);
    process.env.SENTRY_DSN = "https://example@o0.ingest.sentry.io/0";
    expect(isSentryConfigured()).toBe(true);
    if (prev === undefined) delete process.env.SENTRY_DSN;
    else process.env.SENTRY_DSN = prev;
  });
});
