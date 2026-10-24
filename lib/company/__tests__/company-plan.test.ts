import { describe, expect, it } from "vitest";
import { applyVerificationToFeatures, getPlanFeatures } from "@/lib/company/company-plan";
import { getIncludedSeatsForTier } from "@/lib/company/company-extra-seats";

describe("planos empresa (proposta e contato)", () => {
  it("FREE não envia proposta nem vê contato", () => {
    const f = getPlanFeatures("FREE");
    expect(f.canSendProposals).toBe(false);
    expect(f.canViewContacts).toBe(false);
    expect(f.canFavorite).toBe(false);
  });

  it("convite de entrevista começa no Premium; BASIC não envia proposta", () => {
    expect(getPlanFeatures("BASIC").canSendProposals).toBe(false);
    expect(getPlanFeatures("PREMIUM").canSendProposals).toBe(true);
    expect(getPlanFeatures("BASIC").canUseTalentBank).toBe(false);
    expect(getPlanFeatures("PREMIUM").canUseTalentBank).toBe(true);
    expect(getPlanFeatures("EMPRESARIAL").maxUsers).toBe(4);
  });

  it("empresa não verificada perde contato mesmo no BASIC", () => {
    const locked = applyVerificationToFeatures(getPlanFeatures("BASIC"), false);
    expect(locked.canViewContacts).toBe(false);
    expect(applyVerificationToFeatures(getPlanFeatures("PREMIUM"), false).canSendProposals).toBe(false);
    expect(applyVerificationToFeatures(getPlanFeatures("PREMIUM"), true).canSendProposals).toBe(true);
  });

  it("assentos inclusos batem com o plano", () => {
    expect(getIncludedSeatsForTier("BASIC")).toBe(1);
    expect(getIncludedSeatsForTier("PREMIUM")).toBe(2);
    expect(getIncludedSeatsForTier("EMPRESARIAL")).toBe(4);
  });
});
