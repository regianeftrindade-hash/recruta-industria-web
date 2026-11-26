import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import {
  LEGAL_OFFICIAL_BODY_LOCALES,
  legalBodyIsOfficial,
  localesAwaitingLegalTranslation,
} from "@/lib/legal/legal-locale-status";

describe("legal-locale-status", () => {
  it("só pt-BR é corpo jurídico oficial até validação", () => {
    expect(LEGAL_OFFICIAL_BODY_LOCALES).toEqual(["pt-BR"]);
    expect(legalBodyIsOfficial("pt-BR")).toBe(true);
    expect(legalBodyIsOfficial("en")).toBe(false);
  });

  it("lista os demais idiomas como pendentes de tradução oficial", () => {
    const pending = localesAwaitingLegalTranslation();
    expect(pending).toHaveLength(SUPPORTED_LOCALES.length - 1);
    expect(pending).not.toContain("pt-BR");
  });
});
