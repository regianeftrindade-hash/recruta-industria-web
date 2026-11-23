import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("google-ads — consentimento de marketing", () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, ORIGINAL);
    // jsdom-like stubs
    // @ts-expect-error test window
    globalThis.window = {
      dataLayer: [],
      sessionStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        },
        removeItem(key: string) {
          delete this.store[key];
        },
      },
      document: { cookie: "" },
    };
    // @ts-expect-error test document for cookie-consent
    globalThis.document = globalThis.window.document;
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete globalThis.window;
    // @ts-expect-error cleanup
    delete globalThis.document;
    vi.resetModules();
  });

  it("não enfileira conversão sem opt-in de marketing", async () => {
    document.cookie = "ri_cookie_consent=essential";
    const mod = await import("@/lib/analytics/google-ads");
    mod.trackProfessionalSignupConversion();
    expect(window.dataLayer?.length || 0).toBe(0);
    expect(typeof window.gtag).toBe("undefined");
  });

  it("enfileira conversão com opt-in de marketing", async () => {
    document.cookie = "ri_cookie_consent=marketing";
    const mod = await import("@/lib/analytics/google-ads");
    mod.trackProfessionalSignupConversion();
    expect(typeof window.gtag).toBe("function");
    expect((window.dataLayer || []).length).toBeGreaterThan(0);
  });
});
