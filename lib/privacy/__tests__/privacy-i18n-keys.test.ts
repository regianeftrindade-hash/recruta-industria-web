import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";

const KEYS = [
  "privacy.professionalMinAge",
  "privacy.marketingConsentOptional",
  "privacy.marketingConsentRecordedAt",
  "privacy.birthDateLabel",
  "privacy.birthDateHint",
] as const;

describe("privacy i18n keys (12 locales)", () => {
  for (const locale of SUPPORTED_LOCALES) {
    it(`${locale}: chaves LGPD de cadastro/marketing presentes`, () => {
      for (const key of KEYS) {
        const value = t(key, locale);
        expect(value.length).toBeGreaterThan(3);
        expect(value).not.toBe(key);
      }
    });
  }
});
