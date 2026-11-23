import { getAsaasConfig } from "@/lib/payment/asaas-client";
import {
  getStripeConfig,
  listMissingStripePriceEnvs,
  listMissingStripeMonthlyCompanyPriceEnvs,
  listMissingStripeYearlyPriceEnvs,
} from "@/lib/payment/stripe-client";

/** Nomes das variáveis Stripe necessárias para checkout internacional completo. */
export const STRIPE_SANDBOX_ENV_NAMES = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_COMPANY_BASIC_MONTHLY",
  "STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY",
  "STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY",
  "STRIPE_PRICE_COMPANY_BASIC_YEARLY",
  "STRIPE_PRICE_COMPANY_PREMIUM_YEARLY",
  "STRIPE_PRICE_COMPANY_EMPRESARIAL_YEARLY",
  "STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PROFESSIONAL_PREMIUM_YEARLY",
] as const;

/** Nomes das variáveis Asaas necessárias para sandbox BR. */
export const ASAAS_SANDBOX_ENV_NAMES = [
  "ASAAS_API_KEY",
  "ASAAS_API_URL",
  "ASAAS_WEBHOOK_TOKEN",
] as const;

export function isStripeSecretTestMode(secretKey = process.env.STRIPE_SECRET_KEY): boolean {
  return (secretKey || "").trim().includes("_test_");
}

export function isStripePublishableTestMode(
  publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
): boolean {
  return (publishableKey || "").trim().startsWith("pk_test_");
}

export function isStripeLiveSecret(secretKey = process.env.STRIPE_SECRET_KEY): boolean {
  return (secretKey || "").trim().startsWith("sk_live_");
}

export function isAsaasSandboxUrl(apiUrl?: string): boolean {
  const url = (apiUrl ?? getAsaasConfig().apiUrl).toLowerCase();
  return url.includes("sandbox");
}

export function listMissingStripeProfessionalPriceEnvs(): string[] {
  return (
    [
      "STRIPE_PRICE_PROFESSIONAL_PREMIUM_MONTHLY",
      "STRIPE_PRICE_PROFESSIONAL_PREMIUM_YEARLY",
    ] as const
  ).filter((name) => !(process.env[name] || "").trim());
}

/**
 * Snapshot seguro (sem valores) do estado sandbox/TEST dos gateways.
 * Use em /api/payment/config e relatórios — nunca logar secrets.
 */
export function paymentSandboxSnapshot() {
  const stripe = getStripeConfig();
  const asaas = getAsaasConfig();
  const stripeSecretConfigured = Boolean(stripe.secretKey);
  const stripeTestMode = isStripeSecretTestMode(stripe.secretKey);
  const stripeLiveMode = isStripeLiveSecret(stripe.secretKey);
  const publishableTestMode = isStripePublishableTestMode(stripe.publishableKey);
  const asaasKeyConfigured = Boolean(asaas.apiKey);
  const asaasSandbox = isAsaasSandboxUrl(asaas.apiUrl);
  const webhookTokenConfigured = Boolean(
    (process.env.ASAAS_WEBHOOK_TOKEN || process.env.ASAAS_WEBHOOK_SECRET || "").trim(),
  );
  const stripeWebhookConfigured = Boolean(stripe.webhookSecret);
  const missingCompanyMonthly = listMissingStripeMonthlyCompanyPriceEnvs();
  const missingYearly = listMissingStripeYearlyPriceEnvs();
  const missingProfessional = listMissingStripeProfessionalPriceEnvs();
  const missingAllPrices = listMissingStripePriceEnvs();

  return {
    stripeSecretConfigured,
    stripeTestMode,
    stripeLiveMode,
    stripePublishableConfigured: Boolean(stripe.publishableKey),
    stripePublishableTestMode: publishableTestMode,
    stripeWebhookConfigured,
    stripeAdaptivePricingEnabled: stripe.adaptivePricingEnabled,
    missingStripeCompanyMonthlyPriceEnvs: missingCompanyMonthly,
    missingStripeYearlyPriceEnvs: missingYearly,
    missingStripeProfessionalPriceEnvs: missingProfessional,
    missingStripePriceEnvs: missingAllPrices,
    companyIntlCheckoutReady:
      stripeSecretConfigured && missingCompanyMonthly.length === 0,
    professionalIntlCheckoutReady:
      stripeSecretConfigured && missingProfessional.length === 0,
    asaasKeyConfigured,
    asaasSandbox,
    asaasWebhookTokenConfigured: webhookTokenConfigured,
    /** Só true quando NÃO há risco de cobrança real nos gateways ativos. */
    safeForAutomatedSandboxCharges: Boolean(
      (!asaasKeyConfigured || asaasSandbox) &&
        (!stripeSecretConfigured || stripeTestMode) &&
        !stripeLiveMode,
    ),
    /** Onde configurar na Vercel (sem valores). */
    vercelConfigPath:
      "Vercel → Project → Settings → Environment Variables (Production / Preview / Development)",
    requiredStripeEnvNames: [...STRIPE_SANDBOX_ENV_NAMES],
    requiredAsaasEnvNames: [...ASAAS_SANDBOX_ENV_NAMES],
  };
}
