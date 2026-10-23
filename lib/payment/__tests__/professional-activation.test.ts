import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const getProfessionalPlanTier = vi.fn();
const setProfessionalPlanTier = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

vi.mock("@/lib/professional-storage", () => ({
  getProfessionalPlanTier: (...args: unknown[]) => getProfessionalPlanTier(...args),
  setProfessionalPlanTier: (...args: unknown[]) => setProfessionalPlanTier(...args),
}));

import { activateProfessionalPlanFromPayment } from "@/lib/payment/professional-payment";

const meta = JSON.stringify({
  type: "professional_subscription",
  planTier: "PREMIUM",
  professionalUserId: "prof-1",
  expectedAmount: 1990,
  billingPeriod: "monthly",
  billingMode: "one_time",
});

describe("ativação do Premium a partir da cobrança", () => {
  beforeEach(() => {
    findUnique.mockReset();
    getProfessionalPlanTier.mockReset();
    setProfessionalPlanTier.mockReset();
    findUnique.mockResolvedValue({
      id: "rec-1",
      reference: "pay_pro",
      amount: 1990,
      status: "PAID",
      meta,
    });
    getProfessionalPlanTier.mockResolvedValue("FREE");
    setProfessionalPlanTier.mockResolvedValue(undefined);
  });

  it("grava o Premium só depois da cobrança paga no valor do plano", async () => {
    const result = await activateProfessionalPlanFromPayment("prof-1", "pay_pro", "PREMIUM");

    expect(result).toEqual({ alreadyActive: false });
    expect(setProfessionalPlanTier).toHaveBeenCalledTimes(1);
    expect(setProfessionalPlanTier).toHaveBeenCalledWith("prof-1", "PREMIUM", expect.objectContaining({
      billingPeriod: "monthly",
      billingMode: "one_time",
      autoRenew: false,
    }));
  });

  it("não estende o prazo quando a mesma cobrança é confirmada de novo", async () => {
    getProfessionalPlanTier.mockResolvedValue("PREMIUM");

    const result = await activateProfessionalPlanFromPayment("prof-1", "pay_pro", "PREMIUM");

    expect(result).toEqual({ alreadyActive: true });
    expect(setProfessionalPlanTier).not.toHaveBeenCalled();
  });

  it("recusa cobrança pendente, de outra pessoa ou de plano empresarial", async () => {
    findUnique.mockResolvedValueOnce({
      id: "rec-1",
      reference: "pay_pro",
      amount: 1990,
      status: "PENDING",
      meta,
    });
    await expect(activateProfessionalPlanFromPayment("prof-1", "pay_pro", "PREMIUM"))
      .rejects.toThrow("Pagamento ainda não confirmado");

    await expect(activateProfessionalPlanFromPayment("outro", "pay_pro", "PREMIUM"))
      .rejects.toThrow("Cobrança não pertence a este profissional");

    findUnique.mockResolvedValue({
      id: "rec-2",
      reference: "pay_emp",
      amount: 24900,
      status: "PAID",
      meta: JSON.stringify({
        type: "company_subscription",
        planTier: "BASIC",
        companyUserId: "emp-1",
        expectedAmount: 24900,
      }),
    });
    await expect(activateProfessionalPlanFromPayment("emp-1", "pay_emp", "PREMIUM"))
      .rejects.toThrow("Cobrança sem vínculo de plano profissional");

    expect(setProfessionalPlanTier).not.toHaveBeenCalled();
  });
});
