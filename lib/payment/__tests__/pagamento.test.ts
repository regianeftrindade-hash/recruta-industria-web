import { describe, expect, it } from "vitest";
import {
  billingModeLabel,
  billingPeriodLabel,
  formatPlanPriceLabel,
  formatPriceBRL,
  getAnnualPriceCentavos,
  getPlanPriceCentavos,
  getSubscriptionDays,
  parseBillingMode,
  parseBillingPeriod,
} from "@/lib/payment/billing";
import {
  asCompanyPaymentMeta,
  asProfessionalPaymentMeta,
  parsePaymentMeta,
} from "@/lib/payment/payment-config";
import { validateProfessionalPaymentForActivation } from "@/lib/payment/professional-payment";
import { validateCompanyPaymentForActivation } from "@/lib/payment/company-payment";

describe("billing", () => {
  it("parseia período e modo com fallback seguro", () => {
    expect(parseBillingPeriod("annual")).toBe("annual");
    expect(parseBillingPeriod("foo")).toBe("monthly");
    expect(parseBillingMode("recurring")).toBe("recurring");
    expect(parseBillingMode("")).toBe("one_time");
  });

  it("anual cobra 10 meses (2 de desconto)", () => {
    expect(getAnnualPriceCentavos(10000)).toBe(100000);
    expect(getPlanPriceCentavos(10000, "monthly")).toBe(10000);
    expect(getPlanPriceCentavos(10000, "annual")).toBe(100000);
  });

  it("define dias de assinatura e labels de UI", () => {
    expect(getSubscriptionDays("monthly")).toBe(30);
    expect(getSubscriptionDays("annual")).toBe(365);
    expect(billingPeriodLabel("annual")).toBe("Anual");
    expect(billingPeriodLabel("monthly")).toBe("Mensal");
    expect(billingModeLabel("recurring")).toMatch(/recorrente/i);
    expect(billingModeLabel("one_time")).toMatch(/Pix|Boleto/i);
  });

  it("formata preço e label anual com economia", () => {
    expect(formatPriceBRL(24900)).toMatch(/R\$/);
    expect(formatPriceBRL(24900)).toMatch(/24/);
    const annual = formatPlanPriceLabel(10000, "annual");
    expect(annual.period).toBe("/ano");
    expect(annual.savings).toMatch(/2 meses/);
    const monthly = formatPlanPriceLabel(10000, "monthly");
    expect(monthly.period).toBe("/mês");
    expect(monthly.savings).toBeUndefined();
  });
});

describe("meta de pagamento", () => {
  it("rejeita JSON inválido", () => {
    expect(parsePaymentMeta("não-json")).toBeNull();
    expect(asProfessionalPaymentMeta("{}")).toBeNull();
    expect(asCompanyPaymentMeta('{"type":"professional_subscription"}')).toBeNull();
  });

  it("aceita meta profissional completa", () => {
    const meta = JSON.stringify({
      type: "professional_subscription",
      planTier: "PREMIUM",
      professionalUserId: "u1",
      expectedAmount: 1990,
    });
    expect(asProfessionalPaymentMeta(meta)?.professionalUserId).toBe("u1");
  });
});

describe("ativação profissional", () => {
  const meta = JSON.stringify({
    type: "professional_subscription",
    planTier: "PREMIUM",
    professionalUserId: "prof-1",
    expectedAmount: 1990,
  });

  it("bloqueia pagamento não pago", () => {
    expect(
      validateProfessionalPaymentForActivation(
        { id: "1", reference: "r", amount: 1990, status: "PENDING", meta },
        "prof-1",
        "PREMIUM",
      ),
    ).toBe("Pagamento ainda não confirmado");
  });

  it("bloqueia valor diferente do plano", () => {
    expect(
      validateProfessionalPaymentForActivation(
        { id: "1", reference: "r", amount: 1, status: "PAID", meta },
        "prof-1",
        "PREMIUM",
      ),
    ).toBe("Valor pago não confere com o plano");
  });

  it("aceita Premium mensal pago no valor certo", () => {
    expect(
      validateProfessionalPaymentForActivation(
        { id: "1", reference: "r", amount: 1990, status: "PAID", meta },
        "prof-1",
        "PREMIUM",
      ),
    ).toBeNull();
  });
});

describe("ativação empresa", () => {
  const metaMensal = JSON.stringify({
    type: "company_subscription",
    planTier: "BASIC",
    companyUserId: "co-1",
    expectedAmount: 24900,
    billingPeriod: "monthly",
  });

  const metaAnual = JSON.stringify({
    type: "company_subscription",
    planTier: "BASIC",
    companyUserId: "co-1",
    expectedAmount: 249000,
    billingPeriod: "annual",
  });

  it("bloqueia empresa errada", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta: metaMensal },
        "outra",
        "BASIC",
      ),
    ).toBe("Cobrança não pertence a esta empresa");
  });

  it("aceita BASIC mensal pago no valor certo", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta: metaMensal },
        "co-1",
        "BASIC",
      ),
    ).toBeNull();
  });

  it("aceita BASIC anual (10x mensal) e rejeita valor mensal no anual", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 249000, status: "PAID", meta: metaAnual },
        "co-1",
        "BASIC",
        "annual",
      ),
    ).toBeNull();
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta: metaAnual },
        "co-1",
        "BASIC",
        "annual",
      ),
    ).toBe("Valor pago não confere com o plano");
  });

  it("exige vínculo de gateway na assinatura recorrente", () => {
    const metaRecurring = JSON.stringify({
      type: "company_subscription",
      planTier: "BASIC",
      companyUserId: "co-1",
      expectedAmount: 24900,
      billingPeriod: "monthly",
      billingMode: "recurring",
    });
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta: metaRecurring },
        "co-1",
        "BASIC",
        "monthly",
        "recurring",
      ),
    ).toBe("Assinatura recorrente sem vínculo no gateway");
  });

  it("bloqueia plano diferente na meta", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta: metaMensal },
        "co-1",
        "PREMIUM",
      ),
    ).toBe("Plano da cobrança não confere com o solicitado");
  });
});
