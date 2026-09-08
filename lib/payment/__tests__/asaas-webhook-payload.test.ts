import { describe, expect, it } from "vitest";
import {
  extractAsaasPaymentId,
  extractAsaasPaymentStatus,
  mapAsaasPaymentStatus,
} from "@/lib/payment/asaas-client";

/** Payloads típicos de webhook Asaas (PAYMENT_RECEIVED / PAYMENT_DELETED). */
describe("webhook Asaas — payload", () => {
  it("PAYMENT_RECEIVED aninhado marca PAID", () => {
    const payload = {
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_webhook_1", status: "RECEIVED", value: 99.9 },
    };
    expect(extractAsaasPaymentId(payload)).toBe("pay_webhook_1");
    expect(extractAsaasPaymentStatus(payload)).toBe("RECEIVED");
    expect(mapAsaasPaymentStatus(extractAsaasPaymentStatus(payload) || undefined)).toBe("PAID");
  });

  it("PAYMENT_CONFIRMED também é PAID", () => {
    const payload = {
      event: "PAYMENT_CONFIRMED",
      payment: { id: "pay_webhook_2", status: "CONFIRMED" },
    };
    expect(mapAsaasPaymentStatus(extractAsaasPaymentStatus(payload) || undefined)).toBe("PAID");
  });

  it("cancelamento/estorno não viram PAID", () => {
    expect(mapAsaasPaymentStatus("DELETED")).toBe("CANCELED");
    expect(mapAsaasPaymentStatus("REFUNDED")).toBe("DECLINED");
    expect(mapAsaasPaymentStatus("CANCELLED")).toBe("CANCELED");
  });

  it("ignora id que não é cobrança", () => {
    expect(extractAsaasPaymentId({ id: "evt_123", payment: { id: "cus_x" } })).toBeNull();
  });
});
