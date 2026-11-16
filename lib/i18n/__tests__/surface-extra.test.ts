import { describe, expect, it } from "vitest";
import { bindLocale } from "@/lib/i18n/active-locale";
import "@/lib/i18n/active-locale.server";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { localizeServerText } from "@/lib/i18n/server-text";
import { t } from "@/lib/i18n/translate";

describe("textos de tela que ainda estavam soltos", () => {
  it("traduz um erro de API quando a frase já existe no catálogo", () => {
    bindLocale("en");
    expect(localizeServerText("Limpar")).toBe("Clear");
    expect(localizeServerText("Texto livre da empresa")).toBe("Texto livre da empresa");
    bindLocale("pt-BR");
    expect(localizeServerText("Limpar")).toBe("Limpar");
  });

  it("traduz a instalação do aplicativo nos 12 idiomas", () => {
    for (const locale of SUPPORTED_LOCALES) {
      const label = t("surface.pwa.download", locale);
      expect(label.trim().length).toBeGreaterThan(3);
      if (locale !== "pt-BR" && locale !== "pt-PT") {
        expect(label).not.toBe("Baixar aplicativo");
      }
    }
    expect(t("surface.captcha.title", "en")).toBe("Security check");
    expect(t("surface.page.backHome", "es")).toBe("Volver al sitio");
  });
});
