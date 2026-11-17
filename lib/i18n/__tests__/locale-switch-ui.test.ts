import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import LanguageSwitch from "@/components/i18n/LanguageSwitch";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import {
  homeLocaleSlotMode,
  showsGlobalLocaleBar,
} from "@/lib/i18n/locale-switch-placement";
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, textDirection } from "@/lib/i18n/locales";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => undefined }),
  usePathname: () => "/",
}));

describe("seletor de idioma visível", () => {
  it("oferece os 12 idiomas pelo nome nativo", () => {
    const html = renderToStaticMarkup(
      createElement(LanguageSwitch, { current: "pt-BR" }),
    );
    expect(SUPPORTED_LOCALES).toHaveLength(12);
    for (const locale of SUPPORTED_LOCALES) {
      expect(html).toContain(`value="${locale}"`);
      expect(html).toContain(LOCALE_NATIVE_NAMES[locale]);
    }
    expect(html).toContain('data-locale-switch=""');
    expect(html).toContain("Português (Brasil)");
    expect(html).toContain("English");
    expect(html).toContain("العربية");
  });

  it("coloca o seletor no cabeçalho da home e na faixa das outras rotas públicas", () => {
    expect(showsGlobalLocaleBar("/")).toBe(false);
    expect(showsGlobalLocaleBar("/login")).toBe(true);
    expect(showsGlobalLocaleBar("/professional/register")).toBe(true);
    expect(showsGlobalLocaleBar("/company/register")).toBe(true);
    expect(showsGlobalLocaleBar("/company/cadastro")).toBe(true);
    expect(showsGlobalLocaleBar("/company/dashboard-empresa")).toBe(true);
  });

  it("mantém o idioma do visitante ao trocar de página e ao recarregar", () => {
    const depoisDoRefresh = selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "en",
    });
    const noLogin = selectInterfaceLocale({
      authenticated: false,
      cookieLocale: "en",
    });
    expect(depoisDoRefresh).toBe("en");
    expect(noLogin).toBe("en");
    expect(selectInterfaceLocale({ authenticated: false, cookieLocale: "ar" })).toBe("ar");
  });

  it("aplica RTL só no árabe", () => {
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("en")).toBe("ltr");
    expect(textDirection("pt-BR")).toBe("ltr");
  });

  it("entra no fluxo da home no celular e flutua no desktop", () => {
    expect(homeLocaleSlotMode(390)).toBe("flow");
    expect(homeLocaleSlotMode(768)).toBe("flow");
    expect(homeLocaleSlotMode(1024)).toBe("overlay");
  });
});
