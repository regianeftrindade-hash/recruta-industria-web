import { afterEach, describe, expect, it } from "vitest";
import { getPaidProfessionalPlanTiers, PROFESSIONAL_PLAN_TIERS } from "@/lib/professional/professional-premium-plans";
import { isEnvFlagOn, isProfessionalPremiumOfferingEnabled } from "@/lib/professional/premium-offering";
import { VAGAS_COMPATIVEIS_ENABLED } from "@/lib/jobs/vagas-compativeis-flag";

const ENV_KEY = "PROFESSIONAL_PREMIUM_ENABLED";

describe("oferta do Premium profissional", () => {
  const previous = process.env[ENV_KEY];

  afterEach(() => {
    if (previous === undefined) delete process.env[ENV_KEY];
    else process.env[ENV_KEY] = previous;
  });

  it("fica desligada sem a variável e com valores negativos", () => {
    expect(isEnvFlagOn(undefined)).toBe(false);
    expect(isEnvFlagOn("")).toBe(false);
    expect(isEnvFlagOn("false")).toBe(false);
    expect(isEnvFlagOn("0")).toBe(false);
    delete process.env[ENV_KEY];
    expect(isProfessionalPremiumOfferingEnabled()).toBe(false);
  });

  it("liga com true, 1, yes ou on", () => {
    expect(isEnvFlagOn("true")).toBe(true);
    expect(isEnvFlagOn("TRUE")).toBe(true);
    expect(isEnvFlagOn("1")).toBe(true);
    expect(isEnvFlagOn(" yes ")).toBe(true);
    expect(isEnvFlagOn("on")).toBe(true);
    process.env[ENV_KEY] = "true";
    expect(isProfessionalPremiumOfferingEnabled()).toBe(true);
  });

  it("mantém preço, benefícios e a ativação de cobranças já pagas", () => {
    const premium = PROFESSIONAL_PLAN_TIERS.find((plan) => plan.id === "PREMIUM");
    expect(premium?.preco).toBe("R$ 19,90");
    expect(premium?.precoCentavos).toBe(1990);
    expect(premium?.inclui).toEqual([
      "Candidatura automática com um clique, nos métodos suportados pelo site",
      "Lista de empresas identificadas que visualizaram seu perfil",
      "Todas as funcionalidades do plano gratuito",
      "Perfil em destaque na vitrine das empresas",
      "Relatórios detalhados de atividade",
      "Notificações por e-mail (visualização, dica, mensagem e favorito)",
    ]);
    expect(getPaidProfessionalPlanTiers()).toEqual(["PREMIUM"]);
  });
});

describe("vagas compatíveis", () => {
  it("fica fora da experiência atual", () => {
    expect(VAGAS_COMPATIVEIS_ENABLED).toBe(false);
  });
});
