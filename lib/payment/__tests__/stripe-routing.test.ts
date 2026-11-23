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
  envNameForStripePriceKey,
} from "@/lib/payment/stripe-client";
import {
  getStripeCompanyPlanPriceUsdCents,
  formatStripePlanPriceLabel,
} from "@/lib/payment/billing";

describe("payment market routing", () => {
  it("maps BR and BRA to BR market", () => {
    expect(paymentMarketForCountry("BR")).toBe("BR");
    expect(paymentMarketForCountry("bra")).toBe("BR");
  });

  it("maps other countries to INTL; missing country defaults to BR", () => {
    expect(paymentMarketForCountry("US")).toBe("INTL");
    expect(paymentMarketForCountry("PT")).toBe("INTL");
    expect(paymentMarketForCountry(null)).toBe("BR");
    expect(paymentMarketForCountry(undefined)).toBe("BR");
    expect(paymentMarketForCountry("")).toBe("BR");
  });

  it("shouldUseStripe is false for BR", () => {
    expect(shouldUseStripe("BR")).toBe(false);
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
    expect(isStripeReference("stripe_pro_user_1")).toBe(true);
    expect(isStripeReference("stripe_co_user_1")).toBe(true);
    expect(isStripeReference("pay_123")).toBe(false);
  });

  it("resolves monthly and yearly company price keys", () => {
    expect(resolveCompanyStripePriceKey("BASIC", "monthly")).toBe(
      "company_basic_monthly",
    );
    expect(resolveCompanyStripePriceKey("BASIC", "annual")).toBe(
      "company_basic_yearly",
    );
    expect(resolveCompanyStripePriceKey("PREMIUM", "annual")).toBe(
      "company_premium_yearly",
    );
    expect(resolveCompanyStripePriceKey("EMPRESARIAL", "monthly")).toBe(
      "company_empresarial_monthly",
    );
    expect(envNameForStripePriceKey("company_basic_yearly")).toBe(
      "STRIPE_PRICE_COMPANY_BASIC_YEARLY",
    );
  });

  it("resolves professional monthly and yearly keys", () => {
    expect(resolveProfessionalStripePriceKey("PREMIUM", "monthly")).toBe(
      "professional_premium_monthly",
    );
    expect(resolveProfessionalStripePriceKey("PREMIUM", "annual")).toBe(
      "professional_premium_yearly",
    );
    expect(resolveProfessionalStripePriceKey("FREE", "monthly")).toBeNull();
  });
});

describe("Stripe USD reference prices", () => {
  it("uses USD 49/490, 99/990, 199/1990 for company plans", () => {
    expect(getStripeCompanyPlanPriceUsdCents("BASIC", "monthly")).toBe(4900);
    expect(getStripeCompanyPlanPriceUsdCents("BASIC", "annual")).toBe(49000);
    expect(getStripeCompanyPlanPriceUsdCents("PREMIUM", "monthly")).toBe(9900);
    expect(getStripeCompanyPlanPriceUsdCents("PREMIUM", "annual")).toBe(99000);
    expect(getStripeCompanyPlanPriceUsdCents("EMPRESARIAL", "monthly")).toBe(19900);
    expect(getStripeCompanyPlanPriceUsdCents("EMPRESARIAL", "annual")).toBe(199000);
  });

  it("formats USD labels without claiming local currency", () => {
    const m = formatStripePlanPriceLabel("BASIC", "monthly");
    expect(m.period).toBe("/mo");
    expect(m.price).toMatch(/\$?49/);
    const a = formatStripePlanPriceLabel("BASIC", "annual");
    expect(a.period).toBe("/year");
    expect(a.savings).toBeTruthy();
  });
});
