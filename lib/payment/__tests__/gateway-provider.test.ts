import { afterEach, describe, expect, it } from "vitest";
import { createGatewayPayment } from "@/lib/payment/gateway";

describe("roteamento do gateway", () => {
  const previous = process.env.PAYMENT_PROVIDER;

  afterEach(() => {
    if (previous === undefined) delete process.env.PAYMENT_PROVIDER;
    else process.env.PAYMENT_PROVIDER = previous;
  });

  it("não envia Pix do Stripe para o Asaas", async () => {
    process.env.PAYMENT_PROVIDER = "stripe";
    await expect(createGatewayPayment({
      amount: 1000,
      method: "pix",
      customer: { name: "Empresa", email: "empresa@example.com", taxId: "00000000000000" },
    })).rejects.toThrow(/Stripe/);
  });
});
