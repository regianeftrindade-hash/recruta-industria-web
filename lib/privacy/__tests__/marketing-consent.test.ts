import { describe, expect, it } from "vitest";
import {
  buildMarketingConsentSnapshot,
  normalizeMarketingConsentFlag,
  readMarketingConsentFromUnknown,
} from "@/lib/privacy/marketing-consent";

describe("marketing-consent", () => {
  it("default é não concedido", () => {
    expect(normalizeMarketingConsentFlag(undefined)).toBe(false);
    expect(normalizeMarketingConsentFlag(false)).toBe(false);
    expect(readMarketingConsentFromUnknown(null).granted).toBe(false);
  });

  it("registra estado e data ISO", () => {
    const snap = buildMarketingConsentSnapshot(true, new Date("2026-11-26T15:00:00.000Z"));
    expect(snap.marketingConsent).toBe(true);
    expect(snap.marketingConsentAt).toBe("2026-11-26T15:00:00.000Z");
    expect(readMarketingConsentFromUnknown(snap)).toEqual({
      granted: true,
      recordedAt: "2026-11-26T15:00:00.000Z",
    });
  });
});
