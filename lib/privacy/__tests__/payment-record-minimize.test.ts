import { describe, expect, it } from "vitest";
import { minimizePaymentRecordFields } from "@/lib/privacy/payment-record-minimize";

describe("payment-record-minimize", () => {
  it("redige e-mail e CPF no customer JSON", () => {
    const out = minimizePaymentRecordFields({
      customer: JSON.stringify({
        name: "Ana",
        email: "ana@example.com",
        cpf: "123.456.789-00",
        plan: "BASIC",
      }),
      meta: JSON.stringify({ gateway: "asaas", note: "ok" }),
    });
    const customer = JSON.parse(out.customer!);
    expect(customer.email).toBe("[redacted-email]");
    expect(customer.cpf).toBe("[redacted]");
    expect(customer.name).toBe("[redacted]");
    expect(customer.plan).toBe("BASIC");
    expect(JSON.parse(out.meta!).gateway).toBe("asaas");
  });
});
