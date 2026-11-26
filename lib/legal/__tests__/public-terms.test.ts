import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n/locales";
import { t } from "@/lib/i18n/translate";
import {
  getPublicTerm,
  isPublicTermSlug,
  PUBLIC_TERM_SLUGS,
  resolvePublicTermParagraphs,
} from "@/lib/legal/public-terms";

describe("public-terms", () => {
  it("expõe uso e privacidade com corpo pt-BR e pendências jurídicas", () => {
    expect(PUBLIC_TERM_SLUGS).toEqual(["uso", "privacidade"]);
    for (const slug of PUBLIC_TERM_SLUGS) {
      expect(isPublicTermSlug(slug)).toBe(true);
      const doc = getPublicTerm(slug);
      expect(doc).toBeTruthy();
      expect(doc!.paragraphsByLocale["pt-BR"].length).toBeGreaterThan(5);
      expect(doc!.pendingLegalValidation.length).toBeGreaterThan(3);
      // Não inventar CNPJ/endereço no texto
      const body = doc!.paragraphsByLocale["pt-BR"].join("\n");
      expect(body).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
      expect(body.toLowerCase()).not.toContain("representante legal nomeado");
    }
  });

  it("faz fallback de corpo para pt-BR nos 12 idiomas", () => {
    const uso = getPublicTerm("uso")!;
    for (const locale of SUPPORTED_LOCALES) {
      const paragraphs = resolvePublicTermParagraphs(uso, locale);
      expect(paragraphs[0]).toContain("Termos de Uso");
    }
  });

  it("traduz títulos legais nos 12 idiomas (fallback pt-BR ok)", () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(t("legal.termsOfUse", locale).length).toBeGreaterThan(3);
      expect(t("legal.privacyPolicy", locale).length).toBeGreaterThan(3);
      expect(t("legal.pendingReviewHeading", locale).length).toBeGreaterThan(3);
    }
  });

  it("política de privacidade indica canal oficial LGPD e direitos básicos do titular", () => {
    const doc = getPublicTerm("privacidade")!;
    const body = doc.paragraphsByLocale["pt-BR"].join("\n");
    expect(body).toContain("contato@recrutaindustria.com");
    expect(body).toMatch(/canal oficial/i);
    expect(body).toMatch(/acesso aos seus dados pessoais/i);
    expect(body).toMatch(/correção de dados/i);
    expect(body).toMatch(/exclusão \(eliminação\) de dados, quando legalmente cabível/i);
    expect(body).toMatch(/informações sobre o tratamento/i);
    expect(body).toMatch(/maiores de 18 anos/i);
    expect(body).toMatch(/comunicações de marketing/i);
    // Não inventar prazo numérico de atendimento
    expect(body).not.toMatch(/\d+\s*(dias?|horas?)\s*(úteis|corridos)?\s*(para\s+)?(responder|atender|prazo)/i);
  });
});
