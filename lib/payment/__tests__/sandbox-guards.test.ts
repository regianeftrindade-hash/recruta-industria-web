import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  isAsaasSandboxUrl,
  isStripeLiveSecret,
  isStripePublishableTestMode,
  isStripeSecretTestMode,
  listMissingStripeProfessionalPriceEnvs,
  paymentSandboxSnapshot,
  ASAAS_SANDBOX_ENV_NAMES,
  STRIPE_SANDBOX_ENV_NAMES,
} from "@/lib/payment/sandbox-guards";

const ORIGINAL = { ...process.env };

function restore() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL);
}

describe("sandbox-guards — modo TEST sem expor secrets", () => {
  beforeEach(() => {
    restore();
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.ASAAS_API_KEY;
    delete process.env.ASAAS_API_URL;
    delete process.env.ASAAS_WEBHOOK_TOKEN;
    for (const name of STRIPE_SANDBOX_ENV_NAMES) {
      if (name.startsWith("STRIPE_PRICE_")) delete process.env[name];
    }
  });

  afterEach(() => restore());

  it("detecta sk_test / sk_live e pk_test sem vazar valor", () => {
    expect(isStripeSecretTestMode("sk_test_abc")).toBe(true);
    expect(isStripeSecretTestMode("sk_live_abc")).toBe(false);
    expect(isStripeLiveSecret("sk_live_abc")).toBe(true);
    expect(isStripePublishableTestMode("pk_test_xyz")).toBe(true);
    expect(isStripePublishableTestMode("pk_live_xyz")).toBe(false);
  });

  it("detecta URL Asaas sandbox vs produção", () => {
    expect(isAsaasSandboxUrl("https://api-sandbox.asaas.com/v3")).toBe(true);
    expect(isAsaasSandboxUrl("https://api.asaas.com")).toBe(false);
  });

  it("bloqueia cobranças automatizadas quando Stripe é live", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_fake";
    process.env.ASAAS_API_KEY = "asaas_key";
    process.env.ASAAS_API_URL = "https://api-sandbox.asaas.com";
    const snap = paymentSandboxSnapshot();
    expect(snap.stripeLiveMode).toBe(true);
    expect(snap.stripeTestMode).toBe(false);
    expect(snap.asaasSandbox).toBe(true);
    expect(snap.safeForAutomatedSandboxCharges).toBe(false);
  });

  it("permite sandbox automatizado com Stripe TEST + Asaas sandbox", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_fake";
    process.env.ASAAS_API_KEY = "asaas_sandbox_key";
    process.env.ASAAS_API_URL = "https://api-sandbox.asaas.com";
    process.env.ASAAS_WEBHOOK_TOKEN = "tok";
    process.env.STRIPE_PRICE_COMPANY_BASIC_MONTHLY = "price_1";
    process.env.STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY = "price_2";
    process.env.STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY = "price_3";
    process.env.STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY = "price_4";
    process.env.STRIPE_PRICE_PROFESSIONAL_PREMIUM_YEARLY = "price_5";
    process.env.STRIPE_PRICE_COMPANY_BASIC_YEARLY = "price_6";
    process.env.STRIPE_PRICE_COMPANY_PREMIUM_YEARLY = "price_7";
    process.env.STRIPE_PRICE_COMPANY_EMPRESARIAL_YEARLY = "price_8";

    const snap = paymentSandboxSnapshot();
    expect(snap.stripeTestMode).toBe(true);
    expect(snap.asaasSandbox).toBe(true);
    expect(snap.safeForAutomatedSandboxCharges).toBe(true);
    expect(snap.companyIntlCheckoutReady).toBe(true);
    expect(snap.professionalIntlCheckoutReady).toBe(true);
    expect(snap.missingStripePriceEnvs).toEqual([]);
    expect(listMissingStripeProfessionalPriceEnvs()).toEqual([]);
  });

  it("bloqueia quando Asaas aponta para API de produção", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.ASAAS_API_KEY = "asaas_prod_key";
    process.env.ASAAS_API_URL = "https://api.asaas.com";
    const snap = paymentSandboxSnapshot();
    expect(snap.asaasSandbox).toBe(false);
    expect(snap.safeForAutomatedSandboxCharges).toBe(false);
  });

  it("lista nomes de env sem valores", () => {
    expect(STRIPE_SANDBOX_ENV_NAMES.every((n) => n.startsWith("STRIPE_") || n.startsWith("NEXT_PUBLIC_"))).toBe(true);
    expect(ASAAS_SANDBOX_ENV_NAMES.every((n) => n.startsWith("ASAAS_"))).toBe(true);
    expect(paymentSandboxSnapshot().vercelConfigPath).toContain("Environment Variables");
  });
});
