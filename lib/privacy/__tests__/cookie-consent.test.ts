import { describe, expect, it } from "vitest";
import {
  marketingConsentGranted,
  parseCookieConsent,
} from "@/lib/privacy/cookie-consent";

describe("cookie-consent", () => {
  it("parseia níveis válidos", () => {
    expect(parseCookieConsent("essential")).toBe("essential");
    expect(parseCookieConsent("MARKETING")).toBe("marketing");
    expect(parseCookieConsent("")).toBeNull();
    expect(parseCookieConsent("all")).toBeNull();
  });

  it("só libera marketing com opt-in", () => {
    expect(marketingConsentGranted(null)).toBe(false);
    expect(marketingConsentGranted("essential")).toBe(false);
    expect(marketingConsentGranted("marketing")).toBe(true);
  });
});
