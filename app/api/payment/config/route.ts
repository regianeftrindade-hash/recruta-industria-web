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
} from '@/lib/payment-config';
import {
  getGatewayApiUrl,
  verifyGatewayCredentials,
} from '@/lib/payment/gateway';
import { isProfessionalPremiumOfferingEnabled } from '@/lib/professional/premium-offering';

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

  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === 'development';

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
  });
}
