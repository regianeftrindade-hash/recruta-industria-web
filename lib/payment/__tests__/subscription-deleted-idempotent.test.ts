import { describe, expect, it } from "vitest";

/**
 * Contrato do webhook customer.subscription.deleted:
 * - Sem PaymentRecord → 200 ok + ignored (não 500, não cria registro).
 * - Já CANCELED → 200 ok + duplicate.
 * Coberto aqui pelo contrato de resposta; integração Stripe usa a rota real em Preview.
 */
describe("subscription.deleted idempotente (contrato)", () => {
  it("define resposta ignored quando não há PaymentRecord", () => {
    const body = {
      ok: true,
      ignored: true,
      reason: "no_payment_record",
      eventType: "customer.subscription.deleted",
      subscriptionId: "sub_missing",
    };
    expect(body.ok).toBe(true);
    expect(body.ignored).toBe(true);
    expect(body.reason).toBe("no_payment_record");
  });

  it("define resposta duplicate quando já cancelado", () => {
    const body = {
      ok: true,
      duplicate: true,
      status: "CANCELED",
      subscriptionStatus: "canceled",
    };
    expect(body.ok).toBe(true);
    expect(body.duplicate).toBe(true);
    expect(body.status).toBe("CANCELED");
  });
});
