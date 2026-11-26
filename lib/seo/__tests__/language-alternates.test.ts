import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import {
  absoluteSiteUrl,
  languageAlternates,
  languageAlternatesRelative,
  SEO_SITE_ORIGIN,
} from "@/lib/seo/language-alternates";

describe("SEO language alternates (hreflang strategy)", () => {
  it("expõe 12 idiomas + x-default na mesma URL absoluta", () => {
    const alts = languageAlternates("/vagas");
    expect(SUPPORTED_LOCALES).toHaveLength(12);
    expect(Object.keys(alts)).toHaveLength(13);
    expect(alts["x-default"]).toBe(`${SEO_SITE_ORIGIN}/vagas`);
    for (const locale of SUPPORTED_LOCALES) {
      expect(alts[locale]).toBe(`${SEO_SITE_ORIGIN}/vagas`);
    }
  });

  it("normaliza a home com barra final", () => {
    expect(languageAlternates("/")["pt-BR"]).toBe(`${SEO_SITE_ORIGIN}/`);
    expect(absoluteSiteUrl("/")).toBe(`${SEO_SITE_ORIGIN}/`);
  });

  it("gera alternates relativos para metadata Next.js", () => {
    const rel = languageAlternatesRelative("/");
    expect(rel["x-default"]).toBe("/");
    expect(rel.ar).toBe("/");
    expect(rel["zh-CN"]).toBe("/");
    expect(Object.keys(rel)).toHaveLength(13);
  });
});
