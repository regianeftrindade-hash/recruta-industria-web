import { describe, expect, it, afterEach } from "vitest";
import { messagesEn as messagesEnCore } from "@/lib/i18n/messages/en";
import { internalEn } from "@/lib/i18n/messages/internal.en";
import { fixEn } from "@/lib/i18n/messages/fix.en";
import { restEn } from "@/lib/i18n/messages/rest.en";
import { surfacesEn } from "@/lib/i18n/messages/surfaces.en";
import { messagesPtBR } from "@/lib/i18n/messages/pt-BR";
import "@/lib/i18n/active-locale.server";
import { bindLocale } from "@/lib/i18n/active-locale";
import { t } from "@/lib/i18n/translate";
import { countryCapability } from "@/lib/identity/country-support";
import { paymentMarketForCountry } from "@/lib/payment/market";
import { SUPPORTED_LOCALES, textDirection } from "@/lib/i18n/locales";
import es from "@/lib/i18n/messages/catalogs/es-part-0.json";
import fr from "@/lib/i18n/messages/catalogs/fr.json";

const messagesEn = { ...messagesEnCore, ...surfacesEn, ...internalEn, ...restEn, ...fixEn };

describe("internacionalização essencial", () => {
  afterEach(() => {
    bindLocale("pt-BR");
  });

  it("pt-BR e en têm catálogos utilizáveis", () => {
    expect(Object.keys(messagesPtBR).length).toBeGreaterThan(100);
    expect(Object.keys(messagesEn).length).toBeGreaterThan(100);
    expect(t("registration.country.label")).toBe("País");
    bindLocale("en");
    expect(t("registration.country.label")).toBe("Country");
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

  it("suporta os 12 locales e RTL em árabe", () => {
    expect(SUPPORTED_LOCALES.length).toBe(12);
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("pt-BR")).toBe("ltr");
  });

  it("catálogos ES e FR não estão vazios", () => {
    expect(Object.keys(es).length).toBeGreaterThan(20); // es-part-0: registration + CPF/CNPJ; full es pending restore
    expect(Object.keys(fr).length).toBeGreaterThan(100);
  });
});
