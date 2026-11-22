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
import itCatalog from "@/lib/i18n/messages/catalogs/it.json";
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

  it("recusa país, moeda e documento no pedido de idioma", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(parseLocalePreference({ locale })).toEqual({ ok: true, locale });
    }
    expect(parseLocalePreference({ locale: "en-US" })).toEqual({ ok: true, locale: "en" });
    expect(parseLocalePreference({ locale: "pt-BR" })).toEqual({ ok: true, locale: "pt-BR" });
    expect(parseLocalePreference({ locale: "es" })).toEqual({ ok: true, locale: "es" });
    expect(parseLocalePreference({ locale: "pt-PT" })).toEqual({ ok: true, locale: "pt-PT" });
    expect(parseLocalePreference({ locale: "zh-Hans" })).toEqual({ ok: true, locale: "zh-CN" });
    expect(parseLocalePreference({ locale: "ar-EG" })).toEqual({ ok: true, locale: "ar" });
    expect(parseLocalePreference({ locale: "sv" }).ok).toBe(false);
    expect(parseLocalePreference({ locale: "en", currency: "USD" })).toEqual({ ok: false, error: "region" });
    expect(parseLocalePreference({ locale: "en", countryCode: "US" })).toEqual({ ok: false, error: "region" });
    expect(parseLocalePreference({ locale: "en", cpf: "52998224725" })).toEqual({ ok: false, error: "region" });
  });

  it("mantém só o Brasil habilitado para cadastro e cobrança", () => {
    expect(countryCapability("BR")).toMatchObject({
      signupEnabled: true,
      currency: "BRL",
      timeZone: "America/Sao_Paulo",
      payments: "BR",
      identityDocuments: ["CPF", "CNPJ"],
    });
    expect(countryCapability("US").signupEnabled).toBe(false);
    expect(countryCapability("US").identityDocuments).toEqual([]);
    expect(paymentMarketForCountry("BR")).toBe("BR");
    expect(paymentMarketForCountry("US")).toBe("INTL");
  });

  it("formata entrevista no fuso informado e usa Brasília quando falta", () => {
    const when = new Date("2026-03-10T15:00:00.000Z");
    expect(DEFAULT_TIME_ZONE).toBe("America/Sao_Paulo");
    expect(formatInTimeZone(when, "pt-BR", "America/Sao_Paulo", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }))
      .toContain("12");
    const proof = formatInterviewComprovante({
      companyName: "Metalúrgica",
      scheduledAt: when,
      locationType: "PLATFORM",
      observacoes: "",
    });
    expect(proof.horaLabel).toContain("12");
    const lisbon = formatInterviewComprovante({
      companyName: "Metalúrgica",
      scheduledAt: when,
      locationType: "PLATFORM",
      observacoes: "",
      timeZone: "Europe/Lisbon",
    });
    expect(lisbon.horaLabel).not.toBe(proof.horaLabel);
  });

  it("cobre os 12 idiomas com as mesmas chaves e a escrita certa", () => {
    const ptKeys = Object.keys(messagesPtBR).sort();
    const catalogs = { es, fr, de, it: itCatalog, "pt-PT": ptPT, "zh-CN": zhCN, ja, ko, ar, hi };
    expect(SUPPORTED_LOCALES).toHaveLength(12);
    expect(Object.keys(messagesEn).sort()).toEqual(ptKeys);
    for (const catalog of Object.values(catalogs)) {
      const keys = Object.keys(catalog).sort();
      expect(keys).toEqual(ptKeys);
      for (const key of ptKeys) {
        const typed = key as keyof typeof messagesPtBR;
        const foreign = catalog[typed as keyof typeof catalog];
        expect(String(foreign).trim().length).toBeGreaterThan(0);
        expect(messagesPtBR[typed].match(PLACEHOLDER) ?? []).toEqual(String(foreign).match(PLACEHOLDER) ?? []);
      }
    }
    expect(t("surface.home.tagline", "es")).not.toBe(messagesPtBR["surface.home.tagline"]);
    expect(t("surface.home.tagline", "pt-PT")).toMatch(/recrutamento|ecrã|indústria|industria/i);
    expect(zhCN["surface.home.tagline"]).toMatch(/[\u4e00-\u9fff]/);
    expect(ja["surface.home.tagline"]).toMatch(/[\u3040-\u30ff\u4e00-\u9fff]/);
    expect(ko["surface.home.tagline"]).toMatch(/[\uac00-\ud7af]/);
    expect(ar["surface.home.tagline"]).toMatch(/[\u0600-\u06ff]/);
    expect(hi["surface.home.tagline"]).toMatch(/[\u0900-\u097f]/);
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("pt-BR")).toBe("ltr");
    expect(LOCALE_NATIVE_NAMES.ar).toBe("العربية");
    expect(LOCALE_NATIVE_NAMES.hi).toBe("हिन्दी");
    expect(formatMoney(350000, "BRL", "en")).not.toBe(formatMoney(350000, "BRL", "pt-BR"));
    expect(formatMoney(350000, "BRL", "de")).toMatch(/R\$|BRL/);
    expect(formatMoney(350000, "BRL", "de")).not.toBe(formatMoney(350000, "BRL", "pt-BR"));
    bindLocale("de");
    const instant = new Date("2026-08-01T15:00:00Z");
    expect(formatUiDate(instant, { timeZone: "UTC" })).toBe(
      instant.toLocaleDateString("de", { timeZone: "UTC" }),
    );
    expect(formatUiNumber(3500)).toBe((3500).toLocaleString("de"));
    bindLocale("ar");
    expect(formatUiNumber(3500)).toBe((3500).toLocaleString("ar-u-nu-latn"));
    expect(formatUiNumber(3500)).toMatch(/3500|3[\s.,]500/);
    expect(ptPT["registration.simple.phonePlaceholder"]).toBe("(00) 00000-0000");
    expect(ptPT["registration.simple.cpfPlaceholder"]).toBe("000.000.000-00");
    expect(ptPT["fix.test.q23"]).toMatch(/maneiras/);
    expect(String(ptPT["registration.simple.phonePlaceholder"])).not.toContain("9XX");
  });
});
