/**
 * Cliente Stripe — pagamentos internacionais (país de faturamento ≠ BR).
 * Checkout hospedado; não armazenamos dados de cartão.
 *
 * Env (servidor):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (opcional no browser)
 *
 * Price IDs (opcionais até cadastrados no Dashboard):
 *   STRIPE_PRICE_COMPANY_BASIC_MONTHLY
 *   STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY
 *   STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY
 *   STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY
 */
import { createHmac, timingSafeEqual } from "crypto";
import { paymentMarketForCountry } from "@/lib/payment/market";

export type StripeConfig = {
  secretKey: string;
  webhookSecret: string;
  publishableKey: string;
  enabled: boolean;
};

export function getStripeConfig(): StripeConfig {
  const secretKey = (process.env.STRIPE_SECRET_KEY || "").trim();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  const publishableKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  return {
    secretKey,
    webhookSecret,
    publishableKey,
    enabled: Boolean(secretKey),
  };
}

export function isStripeEnabled(): boolean {
  return getStripeConfig().enabled;
}

/** Stripe apenas para mercado internacional. Brasil permanece no Asaas. */
export function shouldUseStripe(billingCountryCode: string | null | undefined): boolean {
  if (!isStripeEnabled()) return false;
  return paymentMarketForCountry(billingCountryCode) === "INTL";
}

export type StripePlanPriceKey =
  | "company_basic_monthly"
  | "company_premium_monthly"
  | "company_empresarial_monthly"
  | "professional_premium_monthly";

const PRICE_ENV: Record<StripePlanPriceKey, string> = {
  company_basic_monthly: "STRIPE_PRICE_COMPANY_BASIC_MONTHLY",
  company_premium_monthly: "STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY",
  company_empresarial_monthly: "STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY",
  professional_premium_monthly: "STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY",
};

export function getStripePriceId(key: StripePlanPriceKey): string | null {
  const envName = PRICE_ENV[key];
  const value = (process.env[envName] || "").trim();
  return value || null;
}

export function resolveCompanyStripePriceKey(
  planTier: string,
  _billingPeriod: "monthly" | "annual" = "monthly",
): StripePlanPriceKey | null {
  const tier = planTier.toUpperCase();
  if (tier === "BASIC") return "company_basic_monthly";
  if (tier === "PREMIUM") return "company_premium_monthly";
  if (tier === "EMPRESARIAL") return "company_empresarial_monthly";
  return null;
}

export function resolveProfessionalStripePriceKey(
  planTier: string,
): StripePlanPriceKey | null {
  if (planTier.toUpperCase() === "PREMIUM") return "professional_premium_monthly";
  return null;
}

export function listMissingStripePriceEnvs(): string[] {
  return Object.values(PRICE_ENV).filter((name) => !(process.env[name] || "").trim());
}

export type StripeCheckoutInput = {
  priceId: string;
  customerEmail: string;
  customerName?: string;
  mode?: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
  metadata: Record<string, string>;
  idempotencyKey?: string;
};

export type StripeCheckoutResult = {
  sessionId: string;
  url: string;
  provider: "stripe";
  status: "PENDING";
};

async function stripeRequest<T>(
  path: string,
  init: {
    method?: string;
    body?: Record<string, unknown>;
    idempotencyKey?: string;
  } = {},
): Promise<T> {
  const { secretKey } = getStripeConfig();
  if (!secretKey) {
    throw new Error("Stripe não configurado (STRIPE_SECRET_KEY ausente).");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (init.idempotencyKey) {
    headers["Idempotency-Key"] = init.idempotencyKey;
  }

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init.method || "POST",
    headers,
    body: init.body ? encodeStripeForm(init.body) : undefined,
  });

  const data = (await res.json()) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = data?.error?.message || `Stripe HTTP ${res.status}`;
    console.error("[stripe]", path, res.status, msg);
    throw new Error(msg);
  }
  return data;
}

function encodeStripeForm(obj: Record<string, unknown>, prefix = ""): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(encodeStripeForm(value as Record<string, unknown>, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          parts.push(encodeStripeForm(item as Record<string, unknown>, `${fullKey}[${i}]`));
        } else {
          parts.push(
            `${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(String(item))}`,
          );
        }
      });
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.filter(Boolean).join("&");
}

export async function createStripeCheckoutSession(
  input: StripeCheckoutInput,
): Promise<StripeCheckoutResult> {
  const mode = input.mode || "subscription";
  const body: Record<string, unknown> = {
    mode,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.clientReferenceId,
    customer_email: input.customerEmail,
    line_items: [{ price: input.priceId, quantity: 1 }],
    metadata: input.metadata,
  };

  if (mode === "subscription") {
    body.subscription_data = { metadata: input.metadata };
  }

  const session = await stripeRequest<{ id: string; url: string | null }>(
    "/checkout/sessions",
    {
      body,
      idempotencyKey: input.idempotencyKey,
    },
  );

  if (!session.id || !session.url) {
    throw new Error("Stripe retornou sessão de checkout inválida.");
  }

  return {
    sessionId: session.id,
    url: session.url,
    provider: "stripe",
    status: "PENDING",
  };
}

export async function retrieveStripeCheckoutSession(sessionId: string): Promise<{
  id: string;
  payment_status: string;
  status: string;
  subscription: string | null;
  metadata: Record<string, string>;
  amount_total: number | null;
  currency: string | null;
  client_reference_id: string | null;
}> {
  const session = await stripeRequest<{
    id: string;
    payment_status: string;
    status: string;
    subscription: string | { id: string } | null;
    metadata?: Record<string, string>;
    amount_total?: number | null;
    currency?: string | null;
    client_reference_id?: string | null;
  }>(`/checkout/sessions/${encodeURIComponent(sessionId)}`, { method: "GET" });

  const sub =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  return {
    id: session.id,
    payment_status: session.payment_status,
    status: session.status,
    subscription: sub,
    metadata: session.metadata || {},
    amount_total: session.amount_total ?? null,
    currency: session.currency ?? null,
    client_reference_id: session.client_reference_id ?? null,
  };
}

export function mapStripePaymentStatus(
  paymentStatus: string | null | undefined,
  sessionStatus?: string | null,
): "PAID" | "PENDING" | "DECLINED" | "CANCELED" {
  const ps = (paymentStatus || "").toLowerCase();
  const ss = (sessionStatus || "").toLowerCase();
  if (ps === "paid") return "PAID";
  if (ps === "unpaid" && (ss === "expired" || ss === "complete")) return "DECLINED";
  if (ss === "expired") return "CANCELED";
  return "PENDING";
}

/** Verifica assinatura do webhook Stripe (HMAC SHA-256). */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  toleranceSec = 300,
): boolean {
  const secret = getStripeConfig().webhookSecret;
  if (!secret || !signatureHeader) return false;

  try {
    const parts = signatureHeader.split(",").map((p) => p.trim());
    const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
    const v1Signatures = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
    if (!timestamp || v1Signatures.length === 0) return false;

    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return false;
    const age = Math.abs(Math.floor(Date.now() / 1000) - ts);
    if (age > toleranceSec) return false;

    const payload = `${timestamp}.${rawBody}`;
    const expected = createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    const expectedBuf = Buffer.from(expected, "utf8");

    return v1Signatures.some((sig) => {
      try {
        const sigBuf = Buffer.from(sig, "utf8");
        return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

export function parseStripeEvent(payload: unknown): StripeEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.id !== "string" || typeof p.type !== "string") return null;
  const data = p.data as { object?: Record<string, unknown> } | undefined;
  if (!data?.object || typeof data.object !== "object") return null;
  return { id: p.id, type: p.type, data: { object: data.object } };
}

export function isStripeReference(ref: string): boolean {
  const r = ref.trim();
  return (
    r.startsWith("cs_") ||
    r.startsWith("sub_") ||
    r.startsWith("in_") ||
    r.startsWith("pi_") ||
    r.startsWith("ch_")
  );
}
