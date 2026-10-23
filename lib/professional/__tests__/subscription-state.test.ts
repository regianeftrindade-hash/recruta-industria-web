import { describe, expect, it } from "vitest";
import { professionalAccessState, professionalChargeNeedsSync } from "@/lib/professional/subscription-state";

describe("estado da assinatura profissional", () => {
  it("mantém Premium ativo mesmo com uma cobrança antiga recusada", () => {
    expect(professionalAccessState({ isPremium: true, latestChargeStatus: "DECLINED" })).toBe("active");
  });

  it("não libera Premium só porque a última cobrança está pendente, recusada ou cancelada", () => {
    expect(professionalAccessState({ isPremium: false, latestChargeStatus: "PENDING" })).toBe("pending");
    expect(professionalAccessState({ isPremium: false, latestChargeStatus: "DECLINED" })).toBe("declined");
    expect(professionalAccessState({ isPremium: false, latestChargeStatus: "CANCELED" })).toBe("canceled");
    expect(professionalAccessState({ isPremium: false, latestChargeStatus: null })).toBe("free");
  });

  it("pede nova confirmação quando o registro local está pago e o plano ainda é gratuito", () => {
    expect(professionalChargeNeedsSync({ isPremium: false, latestChargeStatus: "PAID" })).toBe(true);
    expect(professionalChargeNeedsSync({ isPremium: true, latestChargeStatus: "PAID" })).toBe(false);
    expect(professionalAccessState({ isPremium: false, latestChargeStatus: "PAID" })).toBe("free");
  });
});
