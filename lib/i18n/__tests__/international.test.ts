import { describe, expect, it, afterEach } from "vitest";
import { messagesEn as messagesEnCore } from "@/lib/i18n/messages/en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import { messagesPtBR } from "@/lib/i18n/messages/pt-BR";

const messagesEn = { ...messagesEnCore, ...surfacesEn, ...internalEn, ...restEn, ...fixEn };
import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { parseLocalePreference } from "@/lib/i18n/locale-preference";
import { t } from "@/lib/i18n/translate";
import { localizeServerText } from "@/lib/i18n/server-text";
import { exactUi } from "@/lib/i18n/exact-ui";
import { countryCapability } from "@/lib/identity/country-support";
import { paymentMarketForCountry } from "@/lib/payment/market";
import { DEFAULT_TIME_ZONE, formatInTimeZone } from "@/lib/datetime/format-in-zone";
import { formatInterviewComprovante } from "@/lib/company/job-proposals-shared";
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES, textDirection } from "@/lib/i18n/locales";
import { formatMoney } from "@/lib/money/format-money";
import { formatUiDate, formatUiNumber } from "@/lib/i18n/format-ui";
import es from "@/lib/i18n/messages/catalogs/es.json";
import fr from "@/lib/i18n/messages/catalogs/fr.json";
import de from "@/lib/i18n/messages/catalogs/de.json";
import it from "@/lib/i18n/messages/catalogs/it.json";
import ptPT from "@/lib/i18n/messages/catalogs/pt-PT.json";
import zhCN from "@/lib/i18n/messages/catalogs/zh-CN.json";
import ja from "@/lib/i18n/messages/catalogs/ja.json";
import ko from "@/lib/i18n/messages/catalogs/ko.json";
import ar from "@/lib/i18n/messages/catalogs/ar.json";
import hi from "@/lib/i18n/messages/catalogs/hi.json";

const PLACEHOLDER = /\{[a-zA-Z]+\}/g;

describe("inglês e preferência regional", () => {
  afterEach(() => {
    bindLocale("pt-BR");
  });

  it("traduz o catálogo inteiro e preserva os marcadores", () => {
    const ptKeys = Object.keys(messagesPtBR);
    const enKeys = Object.keys(messagesEn);
    expect(enKeys.sort()).toEqual(ptKeys.sort());
    for (const key of ptKeys) {
      const typed = key as keyof typeof messagesPtBR;
      const pt = messagesPtBR[typed];
      const en = messagesEn[typed];
      expect(en.trim().length).toBeGreaterThan(0);
      expect(pt.match(PLACEHOLDER) ?? []).toEqual(en.match(PLACEHOLDER) ?? []);
    }
    expect(t("rest.profile.title")).toBe("Cadastro completo");
    expect(t("rest.profile.title", "en")).toBe("Full registration");
    expect(t("rest.profile.experiences", "en")).toBe("Experiences");
    expect(t("rest.profile.experience", "en")).toBe("Experience");
    expect(t("fix.video.title", "en")).toBe("Introduction video");
    expect(t("fix.video.title")).toBe("Vídeo de apresentação");
    bindLocale("en");
    expect(exactUi("Planos para Empresas")).toBe("Plans for companies");
    expect(exactUi("Texto livre do candidato")).toBe("Texto livre do candidato");
    bindLocale("pt-BR");
    expect(exactUi("Planos para Empresas")).toBe("Planos para Empresas");
    bindLocale("en");
    expect(localizeServerText("Não autenticado")).toBe("Not signed in");
    expect(localizeServerText("Texto livre da empresa")).toBe("Texto livre da empresa");
    bindLocale("pt-BR");
    expect(localizeServerText("Não autenticado")).toBe("Não autenticado");
    expect(t("internal.pro.favorites")).toBe("Favoritos");
    expect(t("internal.pro.favorites", "en")).toBe("Favorites");
    expect(t("surface.home.tagline")).toBe("A indústria evolui. O recrutamento também.");
    expect(t("surface.home.tagline", "en")).toBe("Industry moves forward. So does hiring.");
    expect(t("registration.simple.submit", "en")).toBe("Create account");
    expect(t("locale.switchLabel", "en")).toBe("Language");
    expect(t("registration.country.unavailable", "sv")).toBe(messagesPtBR["registration.country.unavailable"]);
  });

  it("usa o idioma ativo sem trocar o padrão brasileiro", () => {
    expect(t("registration.country.label")).toBe("País");
    bindLocale("en");
    expect(t("registration.country.label")).toBe("Country");
    bindLocale("pt-BR");
    expect(t("registration.country.label")).toBe("País");
  });

  it("aceita preferência de locale suportado", () => {
    expect(parseLocalePreference({ locale: "pt-BR" })).toEqual({ ok: true, locale: "pt-BR" });
  });

  it("habilita cadastro internacional e mantém documentos só no Brasil", () => {
    expect(countryCapability("BR")).toMatchObject({
      signupEnabled: true,
      currency: "BRL",
      payments: "BR",
    });
    expect(countryCapability("US").signupEnabled).toBe(true);
    expect(countryCapability("US").identityDocuments).toEqual([]);
    expect(countryCapability("US").payments).toBe("INTL");
    expect(countryCapability("US").phone).toBe("E164");
    expect(paymentMarketForCountry("BR")).toBe("BR");
    expect(paymentMarketForCountry("US")).toBe("INTL");
  });

  it("formata data no fuso padrão", () => {
    const when = new Date("2024-06-15T15:00:00.000Z");
    expect(formatInTimeZone(when, "pt-BR", "America/Sao_Paulo", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })).toBeTruthy();
  });

  it("catálogos estrangeiros cobrem as mesmas chaves do pt-BR", () => {
    const ptKeys = Object.keys(messagesPtBR).sort();
    for (const catalog of [es, fr, de, it, ptPT, zhCN, ja, ko, ar, hi]) {
      const foreignKeys = Object.keys(catalog).sort();
      expect(foreignKeys).toEqual(ptKeys);
      for (const key of ptKeys) {
        const typed = key as keyof typeof messagesPtBR;
        const foreign = (catalog as Record<string, string>)[key];
        expect(String(foreign).trim().length).toBeGreaterThan(0);
        expect(messagesPtBR[typed].match(PLACEHOLDER) ?? []).toEqual(String(foreign).match(PLACEHOLDER) ?? []);
      }
    }
    expect(t("surface.home.tagline", "es")).not.toBe(messagesPtBR["surface.home.tagline"]);
  });

  it("direção de texto e formatação monetária", () => {
    expect(textDirection("pt-BR")).toBe("ltr");
    expect(textDirection("ar")).toBe("rtl");
    expect(formatMoney(350000, "BRL", "en")).not.toBe(formatMoney(350000, "BRL", "pt-BR"));
    expect(formatMoney(350000, "BRL", "de")).toMatch(/R\$|BRL/);
    expect(formatMoney(350000, "BRL", "de")).not.toBe(formatMoney(350000, "BRL", "pt-BR"));
  });

  it("placeholders de cadastro em pt-PT", () => {
    expect(ptPT["registration.simple.phonePlaceholder"]).toBe("(00) 00000-0000");
    expect(ptPT["registration.simple.cpfPlaceholder"]).toBe("000.000.000-00");
    expect(String(ptPT["registration.simple.phonePlaceholder"])).not.toContain("9XX");
  });
});
