import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCompanyPlanContext,
  loadCompanyRowByUserId,
  getCompanyExtraData,
  isCompanyTestBypassUserId,
  accessFindFirst,
} = vi.hoisted(() => ({
  getCompanyPlanContext: vi.fn(),
  loadCompanyRowByUserId: vi.fn(),
  getCompanyExtraData: vi.fn(),
  isCompanyTestBypassUserId: vi.fn(),
  accessFindFirst: vi.fn(),
}));

vi.mock("@/lib/company-plan", () => ({ getCompanyPlanContext }));
vi.mock("@/lib/company-storage", () => ({
  loadCompanyRowByUserId,
  getCompanyExtraData,
}));
vi.mock("@/lib/company/company-test-bypass", () => ({
  isCompanyTestBypassUserId,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    accessRecord: { findFirst: accessFindFirst },
  },
}));

import {
  assertCompanyCandidateAccess,
  companyHasActiveUnlock,
} from "@/lib/company/company-candidate-access";

describe("assertCompanyCandidateAccess", () => {
  beforeEach(() => {
    getCompanyPlanContext.mockReset();
    loadCompanyRowByUserId.mockReset();
    getCompanyExtraData.mockReset();
    isCompanyTestBypassUserId.mockReset();
    accessFindFirst.mockReset();
  });

  it("nega cadastro incompleto", async () => {
    getCompanyPlanContext.mockResolvedValue({
      ownerUserId: "owner1",
      verification: { canAccessSensitiveProfiles: true },
    });
    loadCompanyRowByUserId.mockResolvedValue({ name: "Empresa X" });
    getCompanyExtraData.mockResolvedValue({
      cnpj: "12.345.678/0001-90",
      responsavelNome: "A",
      responsavelCpf: "529.982.247-25",
      telefone: "",
      endereco: "",
    });
    isCompanyTestBypassUserId.mockResolvedValue(false);

    const result = await assertCompanyCandidateAccess("owner1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.body.requiresRegistration).toBe(true);
    }
  });

  it("nega empresa sem verificação", async () => {
    getCompanyPlanContext.mockResolvedValue({
      ownerUserId: "owner1",
      verification: { canAccessSensitiveProfiles: false },
    });
    loadCompanyRowByUserId.mockResolvedValue({ name: "Empresa X" });
    getCompanyExtraData.mockResolvedValue({
      cnpj: "11222333000181",
      responsavelNome: "Responsável",
      responsavelCpf: "52998224725",
      telefone: "11999999999",
      endereco: "Rua Teste 100",
    });
    isCompanyTestBypassUserId.mockResolvedValue(false);

    const result = await assertCompanyCandidateAccess("owner1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.body.requiresVerification).toBe(true);
    }
  });

  it("libera com cadastro completo e verificação", async () => {
    getCompanyPlanContext.mockResolvedValue({
      ownerUserId: "owner1",
      verification: { canAccessSensitiveProfiles: true },
    });
    loadCompanyRowByUserId.mockResolvedValue({ name: "Empresa X" });
    getCompanyExtraData.mockResolvedValue({
      cnpj: "11222333000181",
      responsavelNome: "Responsável",
      responsavelCpf: "52998224725",
      telefone: "11999999999",
      endereco: "Rua Teste 100",
    });
    isCompanyTestBypassUserId.mockResolvedValue(false);

    const result = await assertCompanyCandidateAccess("owner1");
    expect(result.ok).toBe(true);
  });
});

describe("companyHasActiveUnlock", () => {
  it("retorna true quando há AccessRecord ativo", async () => {
    accessFindFirst.mockResolvedValue({ id: "ar1" });
    await expect(companyHasActiveUnlock("owner1", "prof1")).resolves.toBe(true);
  });

  it("retorna false sem unlock", async () => {
    accessFindFirst.mockResolvedValue(null);
    await expect(companyHasActiveUnlock("owner1", "prof1")).resolves.toBe(false);
  });
});
