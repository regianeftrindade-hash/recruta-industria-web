import { describe, expect, it } from "vitest";
import { scrubSentryEvent } from "@/lib/observability/sentry-privacy";

describe("scrubSentryEvent", () => {
  it("remove e-mail, tokens e chaves Stripe do evento", () => {
    const event = scrubSentryEvent({
      message: "falha para user@empresa.com com sk_live_abc123token",
      request: {
        headers: {
          Authorization: "Bearer super-secret",
          "Content-Type": "application/json",
        },
        cookies: "session=abc",
        data: { password: "123456", plan: "BASIC" },
      },
      user: { email: "a@b.com", ip_address: "1.2.3.4", id: "u1" },
      extra: { whsec: "whsec_xxxxx", note: "ok" },
    });

    expect(event).toBeTruthy();
    expect(String(event?.message)).not.toContain("user@empresa.com");
    expect(String(event?.message)).not.toContain("sk_live_");
    expect((event?.request as { cookies: string }).cookies).toBe("[redacted]");
    expect(
      ((event?.request as { headers: Record<string, string> }).headers)
        .Authorization,
    ).toBe("[redacted]");
    expect(
      ((event?.request as { data: Record<string, string> }).data).password,
    ).toBe("[redacted]");
    expect(((event?.request as { data: Record<string, string> }).data).plan).toBe(
      "BASIC",
    );
    expect((event?.user as { email: string }).email).toBe("[redacted-email]");
    expect((event?.extra as { whsec: string }).whsec).toBe("[redacted]");
  });
});
