import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import {
  getPagSeguroConfig,
  getUsableNotificationUrl,
  verifyPagSeguroCredentials,
} from '@/lib/pagseguro-client';
import { isPaymentGatewayConfigured, isSandboxMode } from '@/lib/payment-config';

export async function GET(request: NextRequest) {
  const configured = isPaymentGatewayConfigured();
  const verification = configured ? await verifyPagSeguroCredentials() : null;
  const webhookUrl = getUsableNotificationUrl();
  const plansEnabled = configured && (verification?.ok ?? false);

  const session = await getServerSession(authOptions);
  const isDev = process.env.NODE_ENV === 'development';

  if (!isDev && !session?.user) {
    return NextResponse.json({
      configured,
      companyPlansEnabled: plansEnabled,
      professionalPlansEnabled: plansEnabled,
      provider: 'pagseguro',
    });
  }

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
    companyPlansEnabled: plansEnabled,
    professionalPlansEnabled: plansEnabled,
    sandboxTokenUrl: isDev ? 'https://portaldev.pagbank.com.br/tokens' : undefined,
  });
}
