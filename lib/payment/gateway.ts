import {
  createAsaasPayment,
  getAsaasChargeStatus,
  getAsaasConfig,
  verifyAsaasCredentials,
  type AsaasPaymentMethod,
} from '@/lib/payment/asaas-client';
import {
  createPagSeguroPayment,
  getPagSeguroChargeStatus,
  getPagSeguroConfig,
  verifyPagSeguroCredentials,
  type PagSeguroPaymentMethod,
} from '@/lib/payment/pagseguro-client';
import {
  getPaymentProvider,
  type PaymentProvider,
} from '@/lib/payment/payment-config';
import {
  isStripeEnabled,
  isStripeReference,
  mapStripePaymentStatus,
  retrieveStripeCheckoutSession,
} from '@/lib/payment/stripe-client';

export type GatewayPaymentMethod = PagSeguroPaymentMethod;

export type GatewayCustomer = {
  name: string;
  email: string;
  taxId?: string;
};

export type CreateGatewayPaymentInput = {
  amount: number;
  method: GatewayPaymentMethod;
  customer: GatewayCustomer;
  description?: string;
  itemReference?: string;
};

export type GatewayPaymentResult = {
  chargeId: string;
  orderId?: string;
  status: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  expiresAt?: string;
  boletoUrl?: string;
  line?: string;
  checkoutUrl?: string;
  provider: PaymentProvider;
};

export function isRecurringGatewaySupported(): boolean {
  return false;
}

export async function verifyGatewayCredentials(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  if (getPaymentProvider() === 'asaas') {
    return verifyAsaasCredentials();
  }
  if (getPaymentProvider() === 'stripe') {
    return {
      ok: isStripeEnabled(),
      status: isStripeEnabled() ? 200 : 503,
      message: isStripeEnabled() ? 'Stripe configurado' : 'STRIPE_SECRET_KEY ausente',
    };
  }
  return verifyPagSeguroCredentials();
}

export function getGatewayApiUrl(): string {
  if (getPaymentProvider() === 'asaas') {
    return getAsaasConfig().apiUrl;
  }
  if (getPaymentProvider() === 'stripe') {
    return 'https://api.stripe.com';
  }
  return getPagSeguroConfig().apiUrl;
}

export async function createGatewayPayment(
  input: CreateGatewayPaymentInput,
): Promise<GatewayPaymentResult> {
  const provider = getPaymentProvider();
  if (provider === 'asaas' || provider !== 'pagseguro') {
    if (input.method === 'card') {
      throw new Error('Pagamento com cartão ainda não está disponível via Asaas. Use Pix ou Boleto.');
    }
    const payment = await createAsaasPayment({
      amount: input.amount,
      method: input.method as AsaasPaymentMethod,
      customer: input.customer,
      description: input.description,
      itemReference: input.itemReference,
    });
    return { ...payment, provider: 'asaas' };
  }
  const payment = await createPagSeguroPayment(input);
  return { ...payment, provider: 'pagseguro' };
}

export async function getGatewayChargeStatus(paymentRef: string): Promise<{
  status: string;
  rawStatus?: string;
} | null> {
  if (isStripeReference(paymentRef)) {
    try {
      let sessionId = paymentRef.startsWith('cs_') ? paymentRef : null;
      if (!sessionId) {
        const { prisma } = await import('@/lib/db');
        const rec = await prisma.paymentRecord.findFirst({
          where: { OR: [{ reference: paymentRef }, { externalId: paymentRef }] },
          select: { externalId: true, reference: true },
        });
        const ext = (rec?.externalId || '').trim();
        if (ext.startsWith('cs_')) sessionId = ext;
      }
      if (!sessionId) return null;
      const session = await retrieveStripeCheckoutSession(sessionId);
      return {
        status: mapStripePaymentStatus(session.payment_status, session.status),
        rawStatus: session.payment_status,
      };
    } catch {
      return null;
    }
  }
  if (getPaymentProvider() === 'asaas' || paymentRef.startsWith('pay_')) {
    return getAsaasChargeStatus(paymentRef);
  }
  return getPagSeguroChargeStatus(paymentRef);
}
