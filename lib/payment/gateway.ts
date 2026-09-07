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
  return getPaymentProvider() === 'pagseguro';
}

export async function verifyGatewayCredentials(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  if (getPaymentProvider() === 'asaas') {
    return verifyAsaasCredentials();
  }
  return verifyPagSeguroCredentials();
}

export function getGatewayApiUrl(): string {
  if (getPaymentProvider() === 'asaas') {
    return getAsaasConfig().apiUrl;
  }
  return getPagSeguroConfig().apiUrl;
}

export async function createGatewayPayment(
  input: CreateGatewayPaymentInput,
): Promise<GatewayPaymentResult> {
  if (getPaymentProvider() === 'asaas') {
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
  if (getPaymentProvider() === 'asaas' || paymentRef.startsWith('pay_')) {
    return getAsaasChargeStatus(paymentRef);
  }
  return getPagSeguroChargeStatus(paymentRef);
}
