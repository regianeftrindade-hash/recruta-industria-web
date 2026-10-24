import { describe, expect, it } from "vitest";
import { COMPANY_PLAN_TIERS, getPlanDefinition } from "@/lib/company/company-premium-plans";
import {
  COMPANY_LAUNCH_MONTHS,
  companyChargeCentavos,
  launchMonthsFromPayments,
} from "@/lib/company/company-launch-price";

describe("preço de lançamento dos planos empresa", () => {
  it("cobra 20% nos três primeiros meses mensais e o preço cheio depois", () => {
    const basic = getPlanDefinition("BASIC");
    expect(basic.precoLancamentoCentavos).toBe(19920);
    expect(companyChargeCentavos(basic, "monthly", 0)).toBe(19920);
    expect(companyChargeCentavos(basic, "monthly", 2)).toBe(19920);
    expect(companyChargeCentavos(basic, "monthly", COMPANY_LAUNCH_MONTHS)).toBe(24900);
    expect(companyChargeCentavos(basic, "annual", 0)).toBe(249000);
    expect(companyChargeCentavos(basic, "monthly", 0, "recurring")).toBe(24900);
    expect(companyChargeCentavos(getPlanDefinition("PREMIUM"), "monthly", 0)).toBe(39920);
    expect(companyChargeCentavos(getPlanDefinition("EMPRESARIAL"), "monthly", 0)).toBe(103920);
  });

  it("conta mês pago e trata o anual como fim do lançamento", () => {
    const meta = (period: "monthly" | "annual") =>
      JSON.stringify({
        type: "company_subscription",
        planTier: "BASIC",
        companyUserId: "co-1",
        expectedAmount: 19920,
        billingPeriod: period,
      });
    expect(
      launchMonthsFromPayments(
        [
          { status: "PAID", meta: meta("monthly") },
          { status: "PENDING", meta: meta("monthly") },
          { status: "PAID", meta: meta("monthly") },
        ],
        "co-1",
      ),
    ).toBe(2);
    expect(launchMonthsFromPayments([{ status: "PAID", meta: meta("annual") }], "co-1")).toBe(3);
  });

  it("mostra a oferta comercial e não anuncia recurso que o sistema não tem", () => {
    const texto = JSON.stringify(COMPANY_PLAN_TIERS);
    expect(texto).toContain("R$ 199,20");
    expect(texto).toContain("R$ 399,20");
    expect(texto).toContain("R$ 1.039,20");
    expect(texto).toContain("ainda sem trava no sistema");
    expect(texto).toContain("Até 150 liberações de contato por mês.");
    expect(texto).not.toContain("Selo Empresa Verificada");
    expect(texto).not.toContain("Relatórios avançados");
    expect(texto).not.toContain("Histórico de ações");
    expect(texto).not.toContain("Registro de candidatos visualizados");
    expect(texto).not.toContain("Painel completo de indicadores");
  });
});
