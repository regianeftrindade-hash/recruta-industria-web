import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { messagesPtBR, type MessageKey } from "@/lib/i18n/messages/pt-BR";
import { messagesEn as enCore } from "@/lib/i18n/messages/en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { brazilOnlyDocumentMessages } from "@/lib/i18n/messages/brazil-only-document";
import { SUPPORTED_LOCALES, htmlLang, textDirection } from "@/lib/i18n/locales";
import { selectInterfaceLocale } from "@/lib/i18n/interface-locale";
import { negotiateAcceptLanguage } from "@/lib/i18n/accept-language";
import { t } from "@/lib/i18n/translate";

const messagesEn = { ...enCore, ...surfacesEn, ...internalEn, ...restEn, ...fixEn };

/** Chaves t()/text() usadas em home, login e cadastros públicos. */
const CRITICAL_PAGE_KEYS = [
  "locale.switchLabel",
  "locale.invalid",
  "fix.test.network",
  "surface.home.tagline",
  "surface.home.accessPro",
  "surface.home.headline",
  "surface.home.body",
  "surface.home.cta",
  "surface.home.photoAlt",
  "surface.home.trust",
  "surface.home.rights",
  "surface.home.privacy",
  "surface.auth.proAccess",
  "surface.auth.companyAccess",
  "surface.auth.email",
  "surface.auth.password",
  "surface.auth.enter",
  "surface.auth.forgot",
  "surface.auth.register",
  "surface.auth.professional",
  "surface.auth.company",
  "registration.simple.accessTag",
  "registration.simple.fullName",
  "registration.simple.cpf",
  "registration.simple.email",
  "registration.simple.phone",
  "registration.simple.password",
  "registration.simple.submit",
  "registration.simple.backHome",
  "registration.ui.cadastro-empresa",
  "registration.ui.razao-social",
  "registration.ui.cnpj",
  "registration.ui.cpf-do-responsavel",
  "registration.ui.voltar-a-pagina-inicial",
  "registration.company.brDocumentsHint",
  "registration.company.intlDocumentsHint",
] as const satisfies readonly MessageKey[];

function loadCatalog(locale: string): Partial<Record<MessageKey, string>> {
  if (locale === "pt-BR") return messagesPtBR;
  if (locale === "en") return messagesEn;
  const raw = JSON.parse(
    readFileSync(resolve(__dirname, `../messages/catalogs/${locale}.json`), "utf8"),
  ) as Partial<Record<MessageKey, string>>;
  return {
    ...raw,
    ...(brazilOnlyDocumentMessages[locale as keyof typeof brazilOnlyDocumentMessages] || {}),
  };
}

describe("Etapa A — chaves críticas e resolução de idioma", () => {
  it("as chaves de home/login/cadastro existem nos 12 catálogos (não vazias)", () => {
    const missing: string[] = [];
    for (const locale of SUPPORTED_LOCALES) {
      const catalog = loadCatalog(locale);
      for (const key of CRITICAL_PAGE_KEYS) {
        // t() cai em pt-BR; exigimos resolução não vazia
        const resolved = (catalog[key] || messagesPtBR[key] || "").trim();
        if (!resolved) missing.push(`${locale}:${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("t() devolve texto distinto de pt-BR para inglês e árabe nas chaves de superfície críticas", () => {
    expect(t("surface.home.cta", "en")).not.toBe(t("surface.home.cta", "pt-BR"));
    expect(t("surface.auth.enter", "en")).not.toBe(t("surface.auth.enter", "pt-BR"));
    expect(t("surface.home.cta", "ar")).not.toBe(t("surface.home.cta", "pt-BR"));
    expect(t("surface.auth.proAccess", "ar")).not.toBe(t("surface.auth.proAccess", "pt-BR"));
  });

  it("cookie, Accept-Language e RTL árabe ficam coerentes com html lang/dir", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(htmlLang(locale)).toBe(locale);
      expect(textDirection(locale)).toBe(locale === "ar" ? "rtl" : "ltr");
      expect(
        selectInterfaceLocale({ authenticated: false, cookieLocale: locale }),
      ).toBe(locale);
    }

    expect(negotiateAcceptLanguage("ar,en;q=0.8")).toBe("ar");
    expect(
      selectInterfaceLocale({
        authenticated: false,
        cookieLocale: null,
        acceptLanguage: "ar-SA,ar;q=0.9",
      }),
    ).toBe("ar");
    expect(textDirection("ar")).toBe("rtl");
    expect(
      selectInterfaceLocale({
        authenticated: false,
        cookieLocale: "ar",
        acceptLanguage: "en-US,en;q=0.9",
      }),
    ).toBe("ar");
  });
});
