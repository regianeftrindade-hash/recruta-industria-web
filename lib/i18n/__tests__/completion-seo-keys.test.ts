import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { bindLocale } from "@/lib/i18n/active-locale";
import { t } from "@/lib/i18n/translate";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const KEYS = [
  "rest.completion.title",
  "rest.completion.percent",
  "rest.completion.priority",
  "rest.completion.hint80",
  "seo.site.titleDefault",
  "seo.site.description",
  "seo.layout.professionalArea",
  "seo.layout.welcome",
] as const;

const CATALOG_LOCALES = SUPPORTED_LOCALES.filter((l) => l !== "pt-BR" && l !== "en");

describe("completion + SEO i18n keys", () => {
  it("resolve em pt-BR e en sem cair em chave crua", () => {
    bindLocale("pt-BR");
    expect(t("rest.completion.title")).toContain("Perfil");
    expect(t("rest.completion.percent").includes("{percent}")).toBe(true);
    bindLocale("en");
    expect(t("rest.completion.title", "en")).toMatch(/Full profile|profile/i);
    expect(t("seo.site.titleDefault", "en")).toContain("Recruta Indústria");
    bindLocale("pt-BR");
  });

  it("existe nos 10 catálogos e difere do inglês nas frases longas", () => {
    const enTitle = t("rest.completion.hint80", "en");
    for (const locale of CATALOG_LOCALES) {
      const catalog = JSON.parse(
        readFileSync(resolve(__dirname, `../messages/catalogs/${locale}.json`), "utf8"),
      ) as Record<string, string>;
      for (const key of KEYS) {
        expect(catalog[key]?.trim(), `${locale}:${key}`).toBeTruthy();
      }
      expect(catalog["rest.completion.hint80"]).not.toBe(enTitle);
    }
  });
});
