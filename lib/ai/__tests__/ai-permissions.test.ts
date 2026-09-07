/**
 * Testes básicos da camada de IA (permissão, limite, flag desligada).
 * Sem banco e sem chamada real à OpenAI.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { scrubPii, stripSensitiveContext } from "@/lib/ai/sanitize";
import { getResourceMonthlyLimit, estimateCostCents } from "@/lib/ai/limits";
import { getPlanFeatures, companyPlanUnlocksPremiumAi } from "@/lib/company/company-plan";
import { parseImprovePresentationBody } from "@/lib/ai/validate";
import { AiServiceError } from "@/lib/ai/errors";
import { getAiReadiness, isAiConfigured } from "@/lib/openai";
import { AI_RESOURCE_META } from "@/lib/ai/resources";

describe("planos existentes (Company.planTier)", () => {
  it("FREE não libera IA Premium", () => {
    expect(getPlanFeatures("FREE").canUseAiPremium).toBe(false);
    expect(companyPlanUnlocksPremiumAi("FREE")).toBe(false);
  });

  it("BASIC não libera IA Premium", () => {
    expect(getPlanFeatures("BASIC").canUseAiPremium).toBe(false);
  });

  it("PREMIUM e EMPRESARIAL liberam IA Premium", () => {
    expect(getPlanFeatures("PREMIUM").canUseAiPremium).toBe(true);
    expect(getPlanFeatures("EMPRESARIAL").canUseAiPremium).toBe(true);
  });
});

describe("limites por recurso e plano", () => {
  it("profissional tem limite em improve_presentation", () => {
    expect(
      getResourceMonthlyLimit({
        resource: "improve_presentation",
        role: "PROFESSIONAL",
      }),
    ).toBeGreaterThan(0);
  });

  it("empresa FREE tem limite 0 em recursos avançados", () => {
    expect(
      getResourceMonthlyLimit({
        resource: "summarize_professional",
        role: "COMPANY",
        companyPlanTier: "FREE",
      }),
    ).toBe(0);
  });

  it("empresa PREMIUM tem limite > 0 em summarize", () => {
    expect(
      getResourceMonthlyLimit({
        resource: "summarize_professional",
        role: "COMPANY",
        companyPlanTier: "PREMIUM",
      }),
    ).toBeGreaterThan(0);
  });
});

describe("IA desativada / readiness", () => {
  const prevFlag = process.env.NEXT_PUBLIC_ENABLE_AI;
  const prevKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_AI = "false";
    process.env.OPENAI_API_KEY = "";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_AI = prevFlag;
    process.env.OPENAI_API_KEY = prevKey;
  });

  it("isAiConfigured é false com flag desligada", () => {
    expect(isAiConfigured()).toBe(false);
  });

  it("getAiReadiness retorna mensagem amigável", () => {
    const r = getAiReadiness();
    expect(r.ready).toBe(false);
    expect(r.message).toBeTruthy();
    expect(String(r.message)).toMatch(/ainda não/i);
  });
});

describe("validação e segurança", () => {
  it("recusa planTier enviado pelo client", () => {
    expect(() => parseImprovePresentationBody({ text: "oi", planTier: "PREMIUM" })).toThrow(
      AiServiceError,
    );
  });

  it("remove CPF/e-mail do texto", () => {
    const { text, redacted } = scrubPii("Meu CPF 123.456.789-09 e email a@b.com");
    expect(text).not.toMatch(/123\.456\.789-09/);
    expect(text).not.toMatch(/a@b\.com/);
    expect(redacted.length).toBeGreaterThan(0);
  });

  it("stripSensitiveContext remove campos sensíveis", () => {
    const out = stripSensitiveContext({
      cargo: "Operador CNC",
      sexoBiologico: "M",
      email: "x@y.com",
      telefone: "11999999999",
    });
    expect(out?.cargo).toBe("Operador CNC");
    expect(out?.sexoBiologico).toBeUndefined();
    expect(out?.email).toBeUndefined();
    expect(out?.telefone).toBeUndefined();
  });

  it("improve_presentation está marcado como implementado", () => {
    expect(AI_RESOURCE_META.improve_presentation.implemented).toBe(true);
    expect(AI_RESOURCE_META.summarize_professional.implemented).toBe(false);
  });

  it("estimateCostCents é não-negativo", () => {
    expect(estimateCostCents(1000, 500)).toBeGreaterThanOrEqual(0);
  });
});
