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
  id: string;
  status: string;
  paymentUrl?: string | null;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  barcode?: string | null;
  expiresAt?: string | null;
  provider: PaymentProvider;
};

export function isRecurringGatewaySupported(): boolean {
  // Stripe subscriptions via Checkout; Asaas recurring not used in new flows
  return false;
}

export async function createGatewayPayment(
  input: CreateGatewayPaymentInput,
  preferredProvider?: PaymentProvider | null,
): Promise<GatewayPaymentResult> {
  const provider =
    preferredProvider ||
    (getPaymentProvider() === 'stripe' ? 'asaas' : getPaymentProvider());

  // Prefer Asaas for BR; never force Stripe for BR
  if (provider === 'asaas' || !preferredProvider) {
    const asaas = await createAsaasPayment({
      amount: input.amount,
      method: input.method as AsaasPaymentMethod,
      customer: input.customer,
      description: input.description,
      externalReference: input.itemReference,
    });
    return {
      id: asaas.id,
      status: asaas.status,
      paymentUrl: asaas.invoiceUrl || asaas.bankSlipUrl,
      qrCode: asaas.pixQrCode,
      qrCodeBase64: asaas.pixQrCodeBase64,
      barcode: asaas.identificationField,
      expiresAt: asaas.dueDate,
      provider: 'asaas',
    };
  }

  if (provider === 'pagseguro') {
    const ps = await createPagSeguroPayment({
      amount: input.amount,
      method: input.method,
      customer: input.customer,
      description: input.description,
      referenceId: input.itemReference,
    });
    return {
      id: ps.id,
      status: ps.status,
      paymentUrl: ps.links?.find((l) => l.rel === 'PAY')?.href,
      qrCode: ps.qr_codes?.[0]?.text,
      qrCodeBase64: null,
      barcode: null,
      expiresAt: ps.qr_codes?.[0]?.expiration_date,
      provider: 'pagseguro',
    };
  }

  throw new Error(`Gateway provider not supported for create: ${provider}`);
}

export async function getGatewayChargeStatus(
  reference: string,
  providerHint?: PaymentProvider | null,
): Promise<{ status: string; paid: boolean; provider: PaymentProvider }> {
  if (isStripeReference(reference) || providerHint === 'stripe') {
    const session = await retrieveStripeCheckoutSession(reference);
    const mapped = mapStripePaymentStatus(session.payment_status, session.status);
    return {
      status: mapped,
      paid: mapped === 'PAID',
      provider: 'stripe',
    };
  }

  if (providerHint === 'pagseguro' || reference.startsWith('ORDE_')) {
    const st = await getPagSeguroChargeStatus(reference);
    return { status: st.status, paid: st.paid, provider: 'pagseguro' };
  }

  const st = await getAsaasChargeStatus(reference);
  return { status: st.status, paid: st.paid, provider: 'asaas' };
}

export async function verifyGatewayCredentials(
  provider?: PaymentProvider | null,
): Promise<{ ok: boolean; provider: PaymentProvider; message?: string }> {
  const p = provider || getPaymentProvider();
  if (p === 'stripe') {
    return {
      ok: isStripeEnabled(),
      provider: 'stripe',
      message: isStripeEnabled() ? undefined : 'STRIPE_SECRET_KEY missing',
    };
  }
  if (p === 'asaas') {
    return verifyAsaasCredentials();
  }
  return verifyPagSeguroCredentials();
}
