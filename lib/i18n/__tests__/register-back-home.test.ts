import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";

describe("voltar à página inicial nos cadastros", () => {
  it("traduz registration.ui.voltar-a-pagina-inicial nos 12 idiomas", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(12);
    for (const locale of SUPPORTED_LOCALES) {
      const label = t("registration.ui.voltar-a-pagina-inicial", locale);
      expect(label.trim().length).toBeGreaterThan(0);
      expect(label).not.toBe("registration.ui.voltar-a-pagina-inicial");
    }
    expect(t("registration.ui.voltar-a-pagina-inicial", "pt-BR")).toBe(
      "Voltar à página inicial",
    );
    expect(t("registration.ui.voltar-a-pagina-inicial", "en")).toBe(
      "Back to the home page",
    );
    expect(t("registration.ui.voltar-a-pagina-inicial", "es")).toBe(
      "Volver a la página de inicio",
    );
  });

  it("traduz textos do cadastro empresa nos 12 idiomas", () => {
    const keys = [
      "registration.company.brDocumentsHint",
      "registration.company.intlDocumentsHint",
      "registration.company.phoneIntlLabel",
      "registration.company.phoneIntlError",
      "registration.company.createdLoginHint",
    ] as const;
    for (const key of keys) {
      for (const locale of SUPPORTED_LOCALES) {
        const label = t(key, locale);
        expect(label.trim().length).toBeGreaterThan(0);
        expect(label).not.toBe(key);
      }
    }
    expect(t("registration.company.createdLoginHint", "pt-BR")).toContain("Conta criada");
    expect(t("registration.company.createdLoginHint", "en")).toContain("Account created");
    expect(t("registration.company.phoneIntlError", "pt-PT")).toMatch(/\+/);
  });
});
