import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createStripeCheckoutSession,
  isStripeEnabled,
  listMissingStripePriceEnvs,
  resolveCompanyStripePriceKey,
  resolveProfessionalStripePriceKey,
  shouldUseStripe,
  stripeCheckoutSessionIdFromRefs,
} from "@/lib/payment/stripe-client";
import { resolvePaymentProvider } from "@/lib/payment/payment-config";
import { getAsaasConfig } from "@/lib/payment/asaas-client";

const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  Object.assign(process.env, ORIGINAL_ENV);
}

const findUnique = vi.fn();
const update = vi.fn();
const retrieveStripeCheckoutSession = vi.fn();
const getAsaasChargeStatus = vi.fn();
const activateCompany = vi.fn();
const activateProfessional = vi.fn();
const activateExtra = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    paymentRecord: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => update(...args),
    },
  },
}));

vi.mock("@/lib/payment/stripe-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payment/stripe-client")>(
    "@/lib/payment/stripe-client",
  );
  return {
    ...actual,
    retrieveStripeCheckoutSession: (...args: unknown[]) =>
      retrieveStripeCheckoutSession(...args),
  };
});

vi.mock("@/lib/payment/asaas-client", async () => {
  const actual = await vi.importActual<typeof import("@/lib/payment/asaas-client")>(
    "@/lib/payment/asaas-client",
  );
  return {
    ...actual,
    getAsaasChargeStatus: (...args: unknown[]) => getAsaasChargeStatus(...args),
  };
});

vi.mock("@/lib/payment/company-payment", () => ({
  activateCompanyPlanFromPayment: (...args: unknown[]) => activateCompany(...args),
  activateCompanyExtraSeatsFromPayment: (...args: unknown[]) => activateExtra(...args),
}));

vi.mock("@/lib/payment/professional-payment", () => ({
  activateProfessionalPlanFromPayment: (...args: unknown[]) => activateProfessional(...args),
}));

describe("inventário sandbox Stripe / Asaas (sem cobrança real)", () => {
  beforeEach(() => {
    restoreEnv();
    process.env.PAYMENT_PROVIDER = "asaas";
    process.env.ASAAS_API_KEY = "asaas_sandbox_fake";
    process.env.ASAAS_API_URL = "https://api-sandbox.asaas.com/v3";
    process.env.STRIPE_SECRET_KEY = "sk_test_sandbox_inventory";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_sandbox";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_sandbox";
    process.env.STRIPE_PRICE_COMPANY_BASIC_MONTHLY = "price_co_basic_m";
    process.env.STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY = "price_co_prem_m";
    process.env.STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY = "price_co_emp_m";
    process.env.STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY = "price_pro_prem_m";
    process.env.STRIPE_PRICE_COMPANY_BASIC_YEARLY = "price_co_basic_y";
    process.env.STRIPE_PRICE_COMPANY_PREMIUM_YEARLY = "price_co_prem_y";
    process.env.STRIPE_PRICE_COMPANY_EMPRESARIAL_YEARLY = "price_co_emp_y";
    process.env.STRIPE_PRICE_PROFESSIONAL_PREMIUM_YEARLY = "price_pro_prem_y";
    process.env.STRIPE_ADAPTIVE_PRICING = "false";
  });

  afterEach(() => {
    restoreEnv();
    vi.unstubAllGlobals();
  });

  it("lista Price IDs obrigatórios e resolve chaves empresa/profissional", () => {
    expect(listMissingStripePriceEnvs()).toEqual([]);
    expect(resolveCompanyStripePriceKey("BASIC", "monthly")).toBe("company_basic_monthly");
    expect(resolveCompanyStripePriceKey("PREMIUM", "annual")).toBe("company_premium_yearly");
    expect(resolveProfessionalStripePriceKey("PREMIUM", "monthly")).toBe(
      "professional_premium_monthly",
    );
    expect(resolveProfessionalStripePriceKey("PREMIUM", "annual")).toBe(
      "professional_premium_yearly",
    );
  });

  it("reporta Price IDs ausentes sem expor valores", () => {
    delete process.env.STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY;
    delete process.env.STRIPE_PRICE_COMPANY_BASIC_YEARLY;
    const missing = listMissingStripePriceEnvs();
    expect(missing).toContain("STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY");
    expect(missing).toContain("STRIPE_PRICE_COMPANY_BASIC_YEARLY");
    expect(missing.every((name) => name.startsWith("STRIPE_PRICE_"))).toBe(true);
  });

  it("mantém Asaas sandbox BR e Stripe TEST para INTL", () => {
    expect(resolvePaymentProvider("BR")).toBe("asaas");
    expect(getAsaasConfig().apiUrl).toContain("sandbox");
    expect(isStripeEnabled()).toBe(true);
    expect(shouldUseStripe("US")).toBe(true);
    expect(resolvePaymentProvider("DE")).toBe("stripe");
  });

  it("cria Checkout profissional em TEST MODE via API mock", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: "cs_test_pro_session",
            url: "https://checkout.stripe.com/c/pay/cs_test_pro_session",
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
      priceId: "price_pro_prem_m",
      successUrl: "http://localhost:3000/professional/pagamento?success=1",
      cancelUrl: "http://localhost:3000/professional/pagamento?canceled=1",
      clientReferenceId: "stripe_pro_user_1_1",
      customerEmail: "pro@example.com",
      mode: "subscription",
      metadata: {
        type: "professional_subscription",
        planTier: "PREMIUM",
        professionalUserId: "user_1",
      },
      idempotencyKey: "stripe_pro_user_1_1",
      adaptivePricing: false,
    });

    expect(result.sessionId).toBe("cs_test_pro_session");
    expect(result.provider).toBe("stripe");
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain("price_pro_prem_m");
    expect(String((init.headers as Record<string, string>).Authorization)).toContain("sk_test_");
  });

  it("resolve sessão Checkout a partir de stripe_pro_/externalId", () => {
    expect(stripeCheckoutSessionIdFromRefs("cs_test_abc", null)).toBe("cs_test_abc");
    expect(stripeCheckoutSessionIdFromRefs("stripe_pro_u_1", "cs_test_abc")).toBe("cs_test_abc");
    expect(stripeCheckoutSessionIdFromRefs("stripe_pro_u_1", "sub_123")).toBeNull();
  });
});

describe("syncPaymentStatusFromGateway — Stripe e Asaas (mock)", () => {
  beforeEach(() => {
    findUnique.mockReset();
    update.mockReset();
    retrieveStripeCheckoutSession.mockReset();
    getAsaasChargeStatus.mockReset();
    activateCompany.mockReset();
    activateProfessional.mockReset();
    activateExtra.mockReset();
    activateProfessional.mockResolvedValue({ alreadyActive: false });
    activateCompany.mockResolvedValue({ alreadyActive: false });
  });

  it("sincroniza stripe_pro_ via externalId cs_ e ativa quando PAID", async () => {
    const { syncPaymentStatusFromGateway } = await import("@/lib/payment/payment-activation");
    const meta = JSON.stringify({
      type: "professional_subscription",
      planTier: "PREMIUM",
      professionalUserId: "prof-1",
      expectedAmount: 1990,
      provider: "stripe",
      stripePriceId: "price_pro_prem_m",
    });
    findUnique
      .mockResolvedValueOnce({
        id: "rec_1",
        reference: "stripe_pro_user_1",
        status: "PENDING",
        externalId: "cs_test_paid",
        meta,
      })
      .mockResolvedValueOnce({
        id: "rec_1",
        reference: "stripe_pro_user_1",
        status: "PAID",
        externalId: "cs_test_paid",
        meta,
      });
    retrieveStripeCheckoutSession.mockResolvedValue({
      id: "cs_test_paid",
      payment_status: "paid",
      status: "complete",
    });

    const result = await syncPaymentStatusFromGateway("stripe_pro_user_1");
    expect(retrieveStripeCheckoutSession).toHaveBeenCalledWith("cs_test_paid");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PAID" }),
      }),
    );
    expect(activateProfessional).toHaveBeenCalled();
    expect(result.status).toBe("PAID");
    expect(result.activated).toBe(true);
  });

  it("sincroniza Asaas pay_ sem chamar Stripe", async () => {
    const { syncPaymentStatusFromGateway } = await import("@/lib/payment/payment-activation");
    const meta = JSON.stringify({
      type: "company_subscription",
      planTier: "BASIC",
      companyUserId: "emp-1",
      expectedAmount: 24900,
    });
    findUnique
      .mockResolvedValueOnce({
        id: "rec_asaas",
        reference: "pay_123",
        status: "PENDING",
        externalId: null,
        meta,
      })
      .mockResolvedValueOnce({
        id: "rec_asaas",
        reference: "pay_123",
        status: "PAID",
        externalId: null,
        meta,
      });
    getAsaasChargeStatus.mockResolvedValue({ status: "PAID" });

    const result = await syncPaymentStatusFromGateway("pay_123");
    expect(getAsaasChargeStatus).toHaveBeenCalledWith("pay_123");
    expect(retrieveStripeCheckoutSession).not.toHaveBeenCalled();
    expect(result.status).toBe("PAID");
    expect(activateCompany).toHaveBeenCalled();
  });
});
