import { buildPixQrCodeDataUrl } from '@/lib/payment/pix-qr';
import { fallbackTaxIdForSandbox, sanitizeTaxId } from '@/lib/payment/payment-tax';

export type AsaasPaymentMethod = 'pix' | 'boleto';

export type AsaasCustomer = {
  name: string;
  email: string;
  taxId?: string;
};

export type CreateAsaasPaymentInput = {
  amount: number;
  method: AsaasPaymentMethod;
  customer: AsaasCustomer;
  description?: string;
  itemReference?: string;
};

export type AsaasPaymentResult = {
  chargeId: string;
  orderId?: string;
  status: string;
  copyPasteKey?: string;
  qrCodeDataUrl?: string;
  expiresAt?: string;
  boletoUrl?: string;
  line?: string;
  checkoutUrl?: string;
};

export function getAsaasConfig() {
  const apiKey = (process.env.ASAAS_API_KEY || '').trim();
  const apiUrl = (
    process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com'
  )
    .trim()
    .replace(/\/$/, '');
  const baseAppUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
  const webhookUrl = (
    process.env.ASAAS_WEBHOOK_URL || `${baseAppUrl}/api/asaas/webhook`
  ).trim();

  return { apiKey, apiUrl, webhookUrl };
}

function asaasHeaders(): Record<string, string> {
  const { apiKey } = getAsaasConfig();
  return {
    'Content-Type': 'application/json',
    access_token: apiKey,
    'User-Agent': 'RecrutaIndustria/1.0',
  };
}

function formatDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function centavosToReais(centavos: number): number {
  return Math.round(centavos) / 100;
}

export function mapAsaasPaymentStatus(status?: string): string {
  const normalized = (status || 'PENDING').toUpperCase();
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(normalized)) return 'PAID';
  if (['REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(normalized)) {
    return 'DECLINED';
  }
  if (['DELETED', 'CANCELLED', 'CANCELED'].includes(normalized)) return 'CANCELED';
  return 'PENDING';
}

async function asaasRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; text: string }> {
  const { apiUrl } = getAsaasConfig();
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      ...asaasHeaders(),
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const text = await response.text();
  let data: T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      data = null;
    }
  }

  return { ok: response.ok, status: response.status, data, text };
}

/** Testa se a API Key do Asaas é aceita. */
export async function verifyAsaasCredentials(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const { apiKey } = getAsaasConfig();
  if (!apiKey) {
    return { ok: false, status: 0, message: 'ASAAS_API_KEY não definida' };
  }

  try {
    const result = await asaasRequest<{ balance?: number }>('/v3/finance/balance');
    if (result.ok) {
      return { ok: true, status: result.status, message: 'API Key válida' };
    }

    if (result.status === 401) {
      return {
        ok: false,
        status: 401,
        message:
          'API Key rejeitada pelo Asaas. Gere uma nova em Integrações > API (sandbox: https://sandbox.asaas.com).',
      };
    }

    return {
      ok: false,
      status: result.status,
      message: `Asaas respondeu ${result.status}: ${result.text.slice(0, 200)}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Falha ao contactar Asaas',
    };
  }
}

async function findAsaasCustomerByTaxId(taxId: string): Promise<string | null> {
  const result = await asaasRequest<{ data?: Array<{ id?: string }> }>(
    `/v3/customers?cpfCnpj=${encodeURIComponent(taxId)}&limit=1`,
  );
  const id = result.data?.data?.[0]?.id;
  return id ? String(id) : null;
}

async function createAsaasCustomer(customer: AsaasCustomer, taxId: string): Promise<string> {
  const result = await asaasRequest<{ id?: string; errors?: Array<{ description?: string }> }>(
    '/v3/customers',
    {
      method: 'POST',
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cpfCnpj: taxId,
        notificationDisabled: false,
      }),
    },
  );

  if (!result.ok || !result.data?.id) {
    const detail =
      result.data?.errors?.[0]?.description || result.text.slice(0, 200) || 'erro desconhecido';
    throw new Error(`Asaas não criou o cliente (${result.status}): ${detail}`);
  }

  return String(result.data.id);
}

async function findOrCreateAsaasCustomer(customer: AsaasCustomer): Promise<string> {
  const isSandbox = getAsaasConfig().apiUrl.includes('sandbox');
  const taxId =
    sanitizeTaxId(customer.taxId) ?? (isSandbox ? fallbackTaxIdForSandbox() : undefined);

  if (!taxId) {
    throw new Error('CPF ou CNPJ do pagador é obrigatório. Complete seu cadastro antes de pagar.');
  }

  const existing = await findAsaasCustomerByTaxId(taxId);
  if (existing) return existing;

  return createAsaasCustomer(customer, taxId);
}

export async function createAsaasPayment(
  input: CreateAsaasPaymentInput,
): Promise<AsaasPaymentResult> {
  const { apiKey } = getAsaasConfig();
  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const amountCentavos = Math.round(input.amount);
  if (!amountCentavos || amountCentavos < 100) {
    throw new Error('Valor inválido para cobrança');
  }

  const customerId = await findOrCreateAsaasCustomer(input.customer);
  const billingType = input.method === 'pix' ? 'PIX' : 'BOLETO';
  const value = centavosToReais(amountCentavos);

  const createResult = await asaasRequest<{
    id?: string;
    status?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
  }>('/v3/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: customerId,
      billingType,
      value,
      dueDate: formatDueDate(input.method === 'pix' ? 1 : 3),
      description: input.description || 'Assinatura Recruta Indústria',
      externalReference: input.itemReference || `recruta-${Date.now()}`,
    }),
  });

  if (!createResult.ok || !createResult.data?.id) {
    const detail = createResult.text.slice(0, 300) || 'erro desconhecido';
    if (createResult.status === 401) {
      throw new Error(
        'Asaas rejeitou a API Key (401). Atualize ASAAS_API_KEY no .env.local e reinicie o servidor.',
      );
    }
    throw new Error(`Asaas rejeitou a cobrança (${createResult.status}): ${detail}`);
  }

  const paymentId = String(createResult.data.id);
  const base: AsaasPaymentResult = {
    chargeId: paymentId,
    orderId: paymentId,
    status: mapAsaasPaymentStatus(createResult.data.status),
    checkoutUrl: createResult.data.invoiceUrl,
    boletoUrl: createResult.data.bankSlipUrl || createResult.data.invoiceUrl,
  };

  if (input.method === 'pix') {
    const pixResult = await asaasRequest<{
      payload?: string;
      encodedImage?: string;
      expirationDate?: string;
    }>(`/v3/payments/${encodeURIComponent(paymentId)}/pixQrCode`);

    if (!pixResult.ok || !pixResult.data?.payload) {
      throw new Error('Asaas não retornou o QR Code Pix');
    }

    const qrCodeDataUrl = pixResult.data.encodedImage
      ? `data:image/png;base64,${pixResult.data.encodedImage}`
      : await buildPixQrCodeDataUrl(pixResult.data.payload);

    return {
      ...base,
      copyPasteKey: pixResult.data.payload,
      qrCodeDataUrl,
      expiresAt: pixResult.data.expirationDate,
    };
  }

  const boletoResult = await asaasRequest<{
    identificationField?: string;
    barCode?: string;
  }>(`/v3/payments/${encodeURIComponent(paymentId)}/identificationField`);

  if (boletoResult.ok) {
    return {
      ...base,
      line: boletoResult.data?.identificationField || boletoResult.data?.barCode,
      boletoUrl: base.boletoUrl,
    };
  }

  return base;
}

export async function getAsaasChargeStatus(paymentRef: string): Promise<{
  status: string;
  rawStatus?: string;
} | null> {
  const { apiKey } = getAsaasConfig();
  if (!apiKey || !paymentRef) return null;

  try {
    const result = await asaasRequest<{ status?: string }>(
      `/v3/payments/${encodeURIComponent(paymentRef)}`,
    );
    if (!result.ok || !result.data?.status) return null;

    return {
      status: mapAsaasPaymentStatus(result.data.status),
      rawStatus: result.data.status,
    };
  } catch {
    return null;
  }
}

/** Extrai ID de cobrança de payloads de webhook Asaas. */
export function extractAsaasPaymentId(payload: Record<string, unknown>): string | null {
  const payment = payload.payment;
  if (payment && typeof payment === 'object') {
    const id = (payment as Record<string, unknown>).id;
    if (typeof id === 'string' && id.startsWith('pay_')) return id;
  }

  const direct = payload.id;
  if (typeof direct === 'string' && direct.startsWith('pay_')) return direct;

  return null;
}

export function extractAsaasPaymentStatus(payload: Record<string, unknown>): string | null {
  const payment = payload.payment;
  if (payment && typeof payment === 'object') {
    const status = (payment as Record<string, unknown>).status;
    if (typeof status === 'string') return status;
  }

  const direct = payload.status;
  if (typeof direct === 'string') return direct;

  return null;
}
