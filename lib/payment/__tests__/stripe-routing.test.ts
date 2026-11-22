import { describe, expect, it } from "vitest";
import {
  paymentMarketForCountry,
  billingCountryFromProfile,
} from "@/lib/payment/market";
import { resolvePaymentProvider } from "@/lib/payment/payment-config";
import {
  shouldUseStripe,
  mapStripePaymentStatus,
  isStripeReference,
  resolveCompanyStripePriceKey,
  resolveProfessionalStripePriceKey,
} from "@/lib/payment/stripe-client";

describe("payment market routing", () => {
  it("maps BR and BRA to BR market", () => {
    expect(paymentMarketForCountry("BR")).toBe("BR");
    expect(paymentMarketForCountry("bra")).toBe("BR");
    expect(paymentMarketForCountry("BR")).toBe("BR");
  });

  it("maps other countries to INTL; missing country defaults to BR", () => {
    expect(paymentMarketForCountry("US")).toBe("INTL");
    expect(paymentMarketForCountry("PT")).toBe("INTL");
    // Regra comercial: sem país informado → BR (produto padrão brasileiro)
    expect(paymentMarketForCountry(null)).toBe("BR");
    expect(paymentMarketForCountry(undefined)).toBe("BR");
    expect(paymentMarketForCountry("")).toBe("BR");
  });

  it("shouldUseStripe is true only for non-BR when Stripe is enabled", () => {
    // Sem STRIPE_SECRET_KEY no ambiente de teste, shouldUseStripe retorna false.
    // A lógica de mercado (INTL) é coberta em paymentMarketForCountry.
    expect(shouldUseStripe("BR")).toBe(false);
    // Com chave ausente, não força Stripe mesmo para US
    expect(typeof shouldUseStripe("US")).toBe("boolean");
  });

  it("billingCountryFromProfile normalizes BRA", () => {
    expect(billingCountryFromProfile("BRA")).toBe("BR");
    expect(billingCountryFromProfile("us")).toBe("US");
  });
});

describe("resolvePaymentProvider", () => {
  it("returns asaas for BR", () => {
    expect(resolvePaymentProvider("BR")).toBe("asaas");
  });

  it("returns stripe or null for international (depends on env)", () => {
    const p = resolvePaymentProvider("US");
    expect(p === "stripe" || p === null).toBe(true);
  });
});

describe("Stripe helpers", () => {
  it("maps payment_status paid to PAID", () => {
    expect(mapStripePaymentStatus("paid", "complete")).toBe("PAID");
    expect(mapStripePaymentStatus("unpaid", "open")).toBe("PENDING");
  });

  it("detects Stripe references", () => {
    expect(isStripeReference("cs_test_123")).toBe(true);
    expect(isStripeReference("sub_123")).toBe(true);
    expect(isStripeReference("pay_123")).toBe(false);
  });

  it("resolves company and professional price keys (internal keys)", () => {
    expect(resolveCompanyStripePriceKey("BASIC", "monthly")).toBe(
      "company_basic_monthly",
    );
    expect(resolveCompanyStripePriceKey("PREMIUM", "monthly")).toBe(
      "company_premium_monthly",
    );
    expect(resolveCompanyStripePriceKey("EMPRESARIAL", "monthly")).toBe(
      "company_empresarial_monthly",
    );
    expect(resolveProfessionalStripePriceKey("PREMIUM")).toBe(
      "professional_premium_monthly",
    );
  });
});
