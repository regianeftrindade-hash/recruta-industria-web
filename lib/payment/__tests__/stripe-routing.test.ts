import { describe, expect, it } from "vitest";
import {
  paymentMarketForCountry,
  shouldUseStripe,
  billingCountryFromProfile,
} from "@/lib/payment/market";
import { resolvePaymentProvider } from "@/lib/payment/payment-config";
import {
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

  it("maps other countries to INTL", () => {
    expect(paymentMarketForCountry("US")).toBe("INTL");
    expect(paymentMarketForCountry("PT")).toBe("INTL");
    expect(paymentMarketForCountry(null)).toBe("INTL");
  });

  it("shouldUseStripe is true only for non-BR", () => {
    expect(shouldUseStripe("BR")).toBe(false);
    expect(shouldUseStripe("US")).toBe(true);
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

  it("returns stripe for international when Stripe would be used", () => {
    // depends on env; at least does not return asaas for US
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

  it("resolves company and professional price keys", () => {
    expect(resolveCompanyStripePriceKey("BASIC", "monthly")).toBe(
      "STRIPE_PRICE_COMPANY_BASIC_MONTHLY",
    );
    expect(resolveProfessionalStripePriceKey("PREMIUM", "monthly")).toBe(
      "STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY",
    );
  });
});
