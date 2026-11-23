import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeCheckoutSession,
  isStripeEnabled,
  parseStripeEvent,
  shouldUseStripe,
  verifyStripeWebhookSignature,
} from "@/lib/payment/stripe-client";
import { resolvePaymentProvider } from "@/lib/payment/payment-config";
import { getPaymentProvider } from "@/lib/payment-config";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

function signStripeWebhook(rawBody: string, secret: string, ts = Math.floor(Date.now() / 1000)) {
  const payload = `${ts}.${rawBody}`;
  const v1 = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `t=${ts},v1=${v1}`;
}

describe("Etapa A — Asaas BR / Stripe INTL (TEST MODE)", () => {
  beforeEach(() => {
    restoreEnv();
    process.env.PAYMENT_PROVIDER = "asaas";
    process.env.ASAAS_API_KEY = "asaas_test_key";
    process.env.ASAAS_API_URL = "https://api-sandbox.asaas.com";
    process.env.STRIPE_SECRET_KEY = "sk_test_etapa_a_fake";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_etapa_a";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_etapa_a";
    process.env.STRIPE_PRICE_COMPANY_BASIC_MONTHLY = "price_test_basic_monthly";
    process.env.STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY = "price_test_premium_monthly";
    process.env.STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY = "price_test_empresarial_monthly";
    process.env.STRIPE_ADAPTIVE_PRICING = "false";
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    restoreEnv();
  });

  it("roteia Brasil → Asaas e internacional → Stripe quando a chave TEST existe", () => {
    expect(getPaymentProvider()).toBe("asaas");
    expect(resolvePaymentProvider("BR")).toBe("asaas");
    expect(shouldUseStripe("BR")).toBe(false);
    expect(isStripeEnabled()).toBe(true);
    expect(shouldUseStripe("US")).toBe(true);
    expect(resolvePaymentProvider("US")).toBe("stripe");
    expect(resolvePaymentProvider("PT")).toBe("stripe");
  });

  it("cria Checkout Session em TEST MODE via API mock (sem cobrança real)", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: "cs_test_etapa_a_session",
          url: "https://checkout.stripe.com/c/pay/cs_test_etapa_a_session",
          object: "checkout.session",
          mode: "subscription",
          payment_status: "unpaid",
          status: "open",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createStripeCheckoutSession({
      priceId: "price_test_basic_monthly",
      successUrl: "http://localhost:3000/company/success?session_id={CHECKOUT_SESSION_ID}",
      cancelUrl: "http://localhost:3000/company/pagamento?canceled=1",
      clientReferenceId: "stripe_co_user_test",
      customerEmail: "intl@example.com",
      metadata: {
        userId: "user_test",
        planTier: "BASIC",
        billingPeriod: "monthly",
      },
      idempotencyKey: "etapa-a-test-1",
      adaptivePricing: false,
    });

    expect(result.sessionId).toBe("cs_test_etapa_a_session");
    expect(result.url).toContain("cs_test_etapa_a_session");
    expect(result.provider).toBe("stripe");
    expect(result.status).toBe("PENDING");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("https://api.stripe.com/v1/checkout/sessions");
    expect(String(init.headers && (init.headers as Record<string, string>).Authorization)).toContain(
      "sk_test_etapa_a_fake",
    );
    const body = String(init.body);
    expect(body).toContain("price_test_basic_monthly");
    expect(body).toContain("mode=subscription");
  });

  it("valida assinatura de webhook Stripe de teste e rejeita payload adulterado", () => {
    const rawBody = JSON.stringify({
      id: "evt_test_etapa_a",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_etapa_a_session",
          payment_status: "paid",
          status: "complete",
          client_reference_id: "stripe_co_user_test",
          metadata: { userId: "user_test", planTier: "BASIC" },
        },
      },
    });
    const secret = "whsec_test_etapa_a";
    const good = signStripeWebhook(rawBody, secret);
    expect(verifyStripeWebhookSignature(rawBody, good)).toBe(true);
    expect(verifyStripeWebhookSignature(rawBody, "t=1,v1=deadbeef")).toBe(false);
    expect(verifyStripeWebhookSignature(rawBody + "x", good)).toBe(false);

    const event = parseStripeEvent(JSON.parse(rawBody));
    expect(event?.id).toBe("evt_test_etapa_a");
    expect(event?.type).toBe("checkout.session.completed");
  });

  it("sem STRIPE_SECRET_KEY o mercado intl não usa Stripe", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeEnabled()).toBe(false);
    expect(shouldUseStripe("US")).toBe(false);
    expect(resolvePaymentProvider("US")).toBeNull();
    expect(resolvePaymentProvider("BR")).toBe("asaas");
  });
});
