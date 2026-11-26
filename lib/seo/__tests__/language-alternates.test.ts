import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";

const SITE = "https://www.recrutaindustria.com";

/** Espelha a regra de app/sitemap.ts — mesma URL, 12 idiomas + x-default. */
function languageAlternates(path: string): Record<string, string> {
  const url = `${SITE}${path === "/" ? "/" : path}`;
  const languages: Record<string, string> = { "x-default": url };
  for (const locale of SUPPORTED_LOCALES) {
    languages[locale] = url;
  }
  return languages;
}

describe("SEO language alternates (hreflang strategy)", () => {
  it("cobre os 12 idiomas + x-default na mesma URL", () => {
    const alts = languageAlternates("/vagas");
    expect(SUPPORTED_LOCALES).toHaveLength(12);
    expect(alts["x-default"]).toBe(`${SITE}/vagas`);
    for (const locale of SUPPORTED_LOCALES) {
      expect(alts[locale]).toBe(`${SITE}/vagas`);
    }
  });

  it("normaliza a home com barra final", () => {
    expect(languageAlternates("/")["pt-BR"]).toBe(`${SITE}/`);
  });
});
