import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { getAsaasConfig, verifyAsaasCredentials } from '@/lib/payment/asaas-client';
import {
  getPagSeguroConfig,
  getUsableNotificationUrl,
} from '@/lib/pagseguro-client';
import {
  getPaymentProvider,
  isPaymentGatewayConfigured,
  isSandboxMode,
  resolvePaymentProvider,
} from '@/lib/payment-config';
import {
  getGatewayApiUrl,
  verifyGatewayCredentials,
} from '@/lib/payment/gateway';
import { isProfessionalPremiumOfferingEnabled } from '@/lib/professional/premium-offering';
import {
  isStripeEnabled,
  listMissingStripeMonthlyCompanyPriceEnvs,
  listMissingStripeYearlyPriceEnvs,
  getStripeConfig,
} from '@/lib/payment/stripe-client';
import { billingCountryFromProfile } from '@/lib/payment/market';
import { prisma } from '@/lib/db';
import { paymentSandboxSnapshot } from '@/lib/payment/sandbox-guards';

export async function GET(request: NextRequest) {
  const provider = getPaymentProvider();
  const configured = isPaymentGatewayConfigured();
  const verification = configured ? await verifyGatewayCredentials() : null;
  const plansEnabled = configured && (verification?.ok ?? false);
  const asaasConfig = getAsaasConfig();
  const asaasVerification = provider === 'asaas'
    ? verification
    : asaasConfig.apiKey
      ? await verifyAsaasCredentials()
      : null;
  const professionalReady = Boolean(asaasConfig.apiKey) && Boolean(asaasVerification?.ok);
  const professionalMessage = asaasVerification?.message ?? 'ASAAS_API_KEY não definida';
  const professionalPremiumOffering = isProfessionalPremiumOfferingEnabled();

  const stripeEnabled = isStripeEnabled();
  const missingMonthlyCompanyPrices = listMissingStripeMonthlyCompanyPriceEnvs();
  const missingYearlyPriceEnvs = listMissingStripeYearlyPriceEnvs();
  // Internacional mensal pronto se chave secreta + Price IDs empresariais mensais
  const internationalCheckoutReady =
    stripeEnabled && missingMonthlyCompanyPrices.length === 0;
  const internationalAnnualReady =
    internationalCheckoutReady &&
    ['STRIPE_PRICE_COMPANY_BASIC_YEARLY', 'STRIPE_PRICE_COMPANY_PREMIUM_YEARLY', 'STRIPE_PRICE_COMPANY_EMPRESARIAL_YEARLY']
      .every((name) => (process.env[name] || '').trim());

  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === 'development';
  const sandboxSnapshot = paymentSandboxSnapshot();

  let billingCountry: string | null = null;
  let resolvedProviderForUser: string | null = null;
  if (session?.user?.email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email.toLowerCase().trim() },
        select: { countryCode: true },
      });
      billingCountry = billingCountryFromProfile(user?.countryCode);
      resolvedProviderForUser = resolvePaymentProvider(billingCountry);
    } catch {
      // ignore — config pública continua
    }
  }

  const stripeCfg = getStripeConfig();
  const stripePublic = {
    stripeEnabled,
    internationalCheckoutReady,
    internationalAnnualReady,
    missingPriceEnvs: missingMonthlyCompanyPrices,
    missingYearlyPriceEnvs,
    missingProfessionalPriceEnvs: sandboxSnapshot.missingStripeProfessionalPriceEnvs,
    professionalIntlCheckoutReady: sandboxSnapshot.professionalIntlCheckoutReady,
    publishableKeyConfigured: Boolean(stripeCfg.publishableKey),
    adaptivePricingEnabled: stripeCfg.adaptivePricingEnabled,
    referenceCurrency: 'USD',
    /** true = STRIPE_SECRET_KEY contém `_test_` (sem expor o valor). */
    stripeTestMode: sandboxSnapshot.stripeTestMode,
    stripeLiveMode: sandboxSnapshot.stripeLiveMode,
    stripePublishableTestMode: sandboxSnapshot.stripePublishableTestMode,
    stripeWebhookConfigured: sandboxSnapshot.stripeWebhookConfigured,
    asaasSandbox: sandboxSnapshot.asaasSandbox,
    asaasWebhookTokenConfigured: sandboxSnapshot.asaasWebhookTokenConfigured,
    safeForAutomatedSandboxCharges: sandboxSnapshot.safeForAutomatedSandboxCharges,
  };

  if (!isDev && !session?.user) {
    return NextResponse.json({
      configured,
      companyPlansEnabled: plansEnabled,
      professionalPlansEnabled: professionalReady,
      professionalPremiumOffering,
      professionalProvider: 'asaas',
      professionalMessage,
      provider,
      recurringSupported: provider === 'pagseguro',
      ...stripePublic,
    });
  }

  if (provider === 'asaas') {
    const { apiUrl, webhookUrl } = getAsaasConfig();
    const webhookTokenConfigured = Boolean(
      process.env.ASAAS_WEBHOOK_TOKEN?.trim() || process.env.ASAAS_WEBHOOK_SECRET?.trim(),
    );

    return NextResponse.json({
      configured,
      tokenValid: verification?.ok ?? false,
      tokenMessage: verification?.message ?? 'API Key não configurada',
      sandbox: isSandboxMode(),
      apiUrl: configured ? apiUrl : null,
      notificationUrl: configured ? webhookUrl : null,
      webhookEnabled: webhookTokenConfigured || isDev,
      webhookMessage: webhookTokenConfigured
        ? 'Webhook ativo (valide o token asaas-access-token)'
        : isDev
          ? 'Webhook liberado em desenvolvimento sem token'
          : 'Defina ASAAS_WEBHOOK_TOKEN em produção',
      provider: 'asaas',
      recurringSupported: false,
      companyPlansEnabled: plansEnabled,
      professionalPlansEnabled: professionalReady,
      professionalPremiumOffering,
      professionalProvider: 'asaas',
      professionalMessage,
      sandboxPanelUrl: isDev ? 'https://sandbox.asaas.com' : undefined,
      billingCountry,
      resolvedProvider: resolvedProviderForUser,
      ...stripePublic,
    });
  }

  const webhookUrl = getUsableNotificationUrl();
  const { apiUrl, notificationUrl } = getPagSeguroConfig();

  return NextResponse.json({
    configured,
    tokenValid: verification?.ok ?? false,
    tokenMessage: verification?.message ?? 'Token não configurado',
    sandbox: isSandboxMode(),
    apiUrl: configured ? apiUrl : null,
    notificationUrl: configured ? notificationUrl : null,
    webhookEnabled: Boolean(webhookUrl),
    webhookMessage: webhookUrl
      ? 'Webhook ativo'
      : 'Webhook desativado em localhost — confirmação via polling na tela',
    provider: 'pagseguro',
    recurringSupported: true,
    companyPlansEnabled: plansEnabled,
    professionalPlansEnabled: professionalReady,
    professionalPremiumOffering,
    professionalProvider: 'asaas',
    professionalMessage,
    sandboxTokenUrl: isDev ? 'https://portaldev.pagbank.com.br/tokens' : undefined,
    gatewayApiUrl: getGatewayApiUrl(),
    billingCountry,
    resolvedProvider: resolvedProviderForUser,
    ...stripePublic,
  });
}
