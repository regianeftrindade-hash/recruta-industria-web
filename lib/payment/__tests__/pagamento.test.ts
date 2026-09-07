import { describe, expect, it } from "vitest";
import {
  getAnnualPriceCentavos,
  getPlanPriceCentavos,
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
  const meta = JSON.stringify({
    type: "company_subscription",
    planTier: "BASIC",
    companyUserId: "co-1",
    expectedAmount: 24900,
  });

  it("bloqueia empresa errada", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta },
        "outra",
        "BASIC",
      ),
    ).toBe("Cobrança não pertence a esta empresa");
  });

  it("aceita BASIC mensal pago no valor certo", () => {
    expect(
      validateCompanyPaymentForActivation(
        { id: "1", reference: "r", amount: 24900, status: "PAID", meta },
        "co-1",
        "BASIC",
      ),
    ).toBeNull();
  });
});
