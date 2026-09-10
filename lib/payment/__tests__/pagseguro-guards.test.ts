import { afterEach, describe, expect, it } from "vitest";
import {
  isValidPagSeguroNotificationUrl,
  preparePagSeguroCustomerEmail,
} from "@/lib/payment/pagseguro-client";
import { isPagBankSubscriptionId } from "@/lib/payment/pagseguro-subscriptions";
import { buildCompanyPaymentDescription, buildCompanyExtraSeatDescription } from "@/lib/payment/company-payment";
import { buildProfessionalPaymentDescription } from "@/lib/payment/professional-payment";

describe("PagBank notification URL", () => {
  it("exige HTTPS público (rejeita localhost)", () => {
    expect(isValidPagSeguroNotificationUrl("https://www.recrutaindustria.com/api/pagseguro/webhook")).toBe(
      true,
    );
    expect(isValidPagSeguroNotificationUrl("http://www.recrutaindustria.com/api/pagseguro/webhook")).toBe(
      false,
    );
    expect(isValidPagSeguroNotificationUrl("https://localhost/api/pagseguro/webhook")).toBe(false);
    expect(isValidPagSeguroNotificationUrl("https://127.0.0.1/hook")).toBe(false);
    expect(isValidPagSeguroNotificationUrl("não-é-url")).toBe(false);
  });
});

describe("e-mail do comprador no sandbox PagBank", () => {
  const prevApi = process.env.PAGSEGURO_API_URL;
  const prevBuyer = process.env.PAGSEGURO_BUYER_EMAIL;

  afterEach(() => {
    if (prevApi === undefined) delete process.env.PAGSEGURO_API_URL;
    else process.env.PAGSEGURO_API_URL = prevApi;
    if (prevBuyer === undefined) delete process.env.PAGSEGURO_BUYER_EMAIL;
    else process.env.PAGSEGURO_BUYER_EMAIL = prevBuyer;
  });

  it("em sandbox adiciona +pagbank sem duplicar", () => {
    delete process.env.PAGSEGURO_BUYER_EMAIL;
    process.env.PAGSEGURO_API_URL = "https://sandbox.api.pagseguro.com";
    expect(preparePagSeguroCustomerEmail("Cliente@Empresa.com")).toBe("cliente+pagbank@empresa.com");
    expect(preparePagSeguroCustomerEmail("cliente+pagbank@empresa.com")).toBe(
      "cliente+pagbank@empresa.com",
    );
  });

  it("em produção mantém o e-mail; override tem prioridade", () => {
    delete process.env.PAGSEGURO_BUYER_EMAIL;
    process.env.PAGSEGURO_API_URL = "https://api.pagseguro.com";
    expect(preparePagSeguroCustomerEmail("cliente@empresa.com")).toBe("cliente@empresa.com");

    process.env.PAGSEGURO_BUYER_EMAIL = "buyer@test.com";
    expect(preparePagSeguroCustomerEmail("qualquer@x.com")).toBe("buyer@test.com");
  });
});

describe("descrições e IDs de cobrança", () => {
  it("reconhece assinatura PagBank", () => {
    expect(isPagBankSubscriptionId("SUBS_ABC123")).toBe(true);
    expect(isPagBankSubscriptionId("pay_123")).toBe(false);
  });

  it("monta descrições legíveis de plano e assentos", () => {
    expect(buildCompanyPaymentDescription("BASIC", "monthly", "one_time")).toMatch(/Empresa/);
    expect(buildCompanyPaymentDescription("PREMIUM", "annual", "recurring")).toMatch(/anual/);
    expect(buildCompanyPaymentDescription("PREMIUM", "annual", "recurring")).toMatch(/recorrente/);
    expect(buildProfessionalPaymentDescription("PREMIUM", "monthly", "one_time")).toMatch(
      /Profissional/,
    );
    expect(buildCompanyExtraSeatDescription(2)).toMatch(/2/);
  });
});
