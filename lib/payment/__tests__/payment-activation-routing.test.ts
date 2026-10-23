import { beforeEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.fn();
const activateCompany = vi.fn();
const activateExtra = vi.fn();
const activateProfessional = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
  },
}));

vi.mock("@/lib/company-payment", () => ({
  activateCompanyPlanFromPayment: (...args: unknown[]) => activateCompany(...args),
  activateCompanyExtraSeatsFromPayment: (...args: unknown[]) => activateExtra(...args),
}));

vi.mock("@/lib/professional-payment", () => ({
  activateProfessionalPlanFromPayment: (...args: unknown[]) => activateProfessional(...args),
}));

import { activatePaidPayment } from "@/lib/payment/payment-activation";

const professionalMeta = JSON.stringify({
  type: "professional_subscription",
  planTier: "PREMIUM",
  professionalUserId: "prof-1",
  expectedAmount: 1990,
});

const companyMeta = JSON.stringify({
  type: "company_subscription",
  planTier: "BASIC",
  companyUserId: "emp-1",
  expectedAmount: 24900,
});

describe("ativação separada de empresa e profissional", () => {
  beforeEach(() => {
    findUnique.mockReset();
    activateCompany.mockReset();
    activateExtra.mockReset();
    activateProfessional.mockReset();
    activateCompany.mockResolvedValue({ alreadyActive: false });
    activateExtra.mockResolvedValue({ alreadyActive: false });
    activateProfessional.mockResolvedValue({ alreadyActive: false });
  });

  it("não ativa nada enquanto a cobrança não está paga", async () => {
    findUnique.mockResolvedValue({
      reference: "pay_1",
      status: "PENDING",
      meta: professionalMeta,
    });

    await expect(activatePaidPayment("pay_1")).resolves.toEqual({ activated: false });
    expect(activateProfessional).not.toHaveBeenCalled();
    expect(activateCompany).not.toHaveBeenCalled();
  });

  it("ativa só o Premium do profissional dono da cobrança", async () => {
    findUnique.mockResolvedValue({
      reference: "pay_pro",
      status: "PAID",
      meta: professionalMeta,
    });

    await expect(activatePaidPayment("pay_pro")).resolves.toMatchObject({
      activated: true,
      type: "professional",
    });
    expect(activateProfessional).toHaveBeenCalledWith("prof-1", "pay_pro", "PREMIUM");
    expect(activateCompany).not.toHaveBeenCalled();
    expect(activateExtra).not.toHaveBeenCalled();
  });

  it("não concede Premium profissional a uma cobrança de empresa", async () => {
    findUnique.mockResolvedValue({
      reference: "pay_emp",
      status: "PAID",
      meta: companyMeta,
    });

    await expect(activatePaidPayment("pay_emp")).resolves.toMatchObject({
      activated: true,
      type: "company",
    });
    expect(activateCompany).toHaveBeenCalledWith("emp-1", "pay_emp", "BASIC");
    expect(activateProfessional).not.toHaveBeenCalled();
  });

  it("trata uma segunda confirmação da mesma cobrança profissional como já ativa", async () => {
    findUnique.mockResolvedValue({
      reference: "pay_pro",
      status: "PAID",
      meta: professionalMeta,
    });
    activateProfessional
      .mockResolvedValueOnce({ alreadyActive: false })
      .mockResolvedValueOnce({ alreadyActive: true });

    await activatePaidPayment("pay_pro");
    const second = await activatePaidPayment("pay_pro");

    expect(second).toMatchObject({ activated: true, alreadyActive: true, type: "professional" });
    expect(activateProfessional).toHaveBeenCalledTimes(2);
    expect(activateCompany).not.toHaveBeenCalled();
  });
});
