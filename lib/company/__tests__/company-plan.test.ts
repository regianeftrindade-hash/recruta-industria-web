import { describe, expect, it } from "vitest";
import { applyVerificationToFeatures, getPlanFeatures } from "@/lib/company/company-plan";
import { getIncludedSeatsForTier } from "@/lib/company/company-extra-seats";
import {
  COMPANY_PLAN_TIERS,
  VIDEO_INTERVIEW_EXCLUDED,
  VIDEO_INTERVIEW_INCLUDED,
  destaquesComerciaisDoPlano,
} from "@/lib/company/company-premium-plans";

describe("planos empresa (proposta e contato)", () => {
  it("FREE não envia proposta nem vê contato", () => {
    const f = getPlanFeatures("FREE");
    expect(f.canSendProposals).toBe(false);
    expect(f.canViewContacts).toBe(false);
    expect(f.canFavorite).toBe(false);
    expect(f.canUseVideoInterview).toBe(false);
  });

  it("BASIC envia proposta; PREMIUM usa banco de talentos", () => {
    expect(getPlanFeatures("BASIC").canSendProposals).toBe(true);
    expect(getPlanFeatures("BASIC").canUseVideoInterview).toBe(true);
    expect(getPlanFeatures("PREMIUM").canUseVideoInterview).toBe(true);
    expect(getPlanFeatures("EMPRESARIAL").canUseVideoInterview).toBe(true);
    expect(getPlanFeatures("BASIC").canUseTalentBank).toBe(false);
    expect(getPlanFeatures("PREMIUM").canUseTalentBank).toBe(true);
    expect(getPlanFeatures("EMPRESARIAL").maxUsers).toBe(4);
  });

  it("empresa não verificada perde proposta e contato mesmo no BASIC", () => {
    const locked = applyVerificationToFeatures(getPlanFeatures("BASIC"), false);
    expect(locked.canSendProposals).toBe(false);
    expect(locked.canViewContacts).toBe(false);
    expect(locked.canUseVideoInterview).toBe(true);
    expect(applyVerificationToFeatures(getPlanFeatures("BASIC"), true).canSendProposals).toBe(true);
  });

  it("assentos inclusos batem com o plano", () => {
    expect(getIncludedSeatsForTier("BASIC")).toBe(1);
    expect(getIncludedSeatsForTier("PREMIUM")).toBe(2);
    expect(getIncludedSeatsForTier("EMPRESARIAL")).toBe(4);
  });

  it("mantém preços e lista a entrevista por vídeo só nos planos pagos", () => {
    const porId = Object.fromEntries(COMPANY_PLAN_TIERS.map((plano) => [plano.id, plano]));
    expect(porId.FREE.preco).toBe("R$ 0");
    expect(porId.FREE.precoCentavos).toBe(0);
    expect(porId.BASIC.preco).toBe("R$ 249");
    expect(porId.BASIC.precoCentavos).toBe(24900);
    expect(porId.PREMIUM.preco).toBe("R$ 499");
    expect(porId.PREMIUM.precoCentavos).toBe(49900);
    expect(porId.EMPRESARIAL.preco).toBe("R$ 1.299");
    expect(porId.EMPRESARIAL.precoCentavos).toBe(129900);

    expect(porId.FREE.naoInclui).toContain(VIDEO_INTERVIEW_EXCLUDED);
    expect(porId.FREE.inclui).not.toContain(VIDEO_INTERVIEW_INCLUDED);
    expect(destaquesComerciaisDoPlano(porId.FREE)).not.toContain(VIDEO_INTERVIEW_INCLUDED);

    for (const id of ["BASIC", "PREMIUM", "EMPRESARIAL"] as const) {
      expect(porId[id].inclui).toContain(VIDEO_INTERVIEW_INCLUDED);
      expect(porId[id].naoInclui ?? []).not.toContain(VIDEO_INTERVIEW_EXCLUDED);
      const destaques = destaquesComerciaisDoPlano(porId[id]);
      expect(destaques.at(-1)).toBe(VIDEO_INTERVIEW_INCLUDED);
      expect(destaques.slice(0, 3)).not.toContain(VIDEO_INTERVIEW_INCLUDED);
    }

    expect(getPlanFeatures("BASIC").maxUnlocksPerMonth).toBe(150);
    expect(getPlanFeatures("PREMIUM").unlimitedUnlocks).toBe(true);
    expect(getPlanFeatures("BASIC").maxUsers).toBe(1);
  });

  it("não anuncia recurso que o site não entrega", () => {
    const texto = COMPANY_PLAN_TIERS.flatMap((plano) => [
      plano.descricao,
      ...plano.inclui,
      ...(plano.naoInclui ?? []),
      ...(plano.limites ?? []),
    ]).join("\n");
    for (const ausente of [
      "Histórico de pesquisas",
      "Histórico avançado",
      "Relatórios básicos",
      "Relatórios avançados",
      "Banco de talentos avançado",
      "Atendimento prioritário",
      "Selo Empresa Verificada",
      "Prioridade em novos recursos",
      "Painel completo de indicadores",
      "Histórico de ações",
      "Estatísticas de utilização",
      "em PDF",
      "explorar o banco de talentos",
    ]) {
      expect(texto).not.toContain(ausente);
    }

    const porId = Object.fromEntries(COMPANY_PLAN_TIERS.map((plano) => [plano.id, plano]));
    expect(porId.BASIC.inclui).toContain("Convites para entrevista");
    expect(porId.BASIC.inclui).toContain("Disponibilidade para contratação e data de atualização do perfil");
    expect(porId.PREMIUM.inclui).toContain("Banco de talentos privado");
    expect(porId.PREMIUM.inclui).toContain("Alertas de profissionais compatíveis no painel");
    expect(porId.PREMIUM.inclui).toContain("Exportação do perfil para impressão");
    expect(porId.EMPRESARIAL.inclui).toContain("Inclusão, remoção e substituição de recrutadores");
    expect(porId.FREE.naoInclui).toContain("Banco de talentos");
  });
});
