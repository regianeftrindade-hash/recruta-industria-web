import { buildPixQrCodeDataUrl } from '@/lib/pix-qr';
import { isSandboxMode } from '@/lib/payment-config';
import { fallbackTaxIdForSandbox, sanitizeTaxId } from '@/lib/payment-tax';

export type PagSeguroPaymentMethod = 'pix' | 'boleto' | 'card';

export type PagSeguroCustomer = {
  name: string;
  email: string;
  taxId?: string;
};

export type CreatePagSeguroPaymentInput = {
  amount: number;
  method: PagSeguroPaymentMethod;
  customer: PagSeguroCustomer;
  description?: string;
  itemReference?: string;
};

export type PagSeguroPaymentResult = {
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

export function getPagSeguroConfig() {
  const token = (process.env.PAGSEGURO_TOKEN || process.env.PAGBANK_TOKEN || '').trim();
  const apiUrl = (
    process.env.PAGSEGURO_API_URL ||
    process.env.PAGBANK_API_URL ||
    'https://sandbox.api.pagseguro.com'
  ).trim().replace(/\/$/, '');
  const baseAppUrl = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim();
  const notificationUrl = (
    process.env.PAGSEGURO_NOTIFICATION_URL ||
    `${baseAppUrl}/api/pagseguro/webhook`
  ).trim();

  return { token, apiUrl, notificationUrl };
}

/** PagBank exige URL pública HTTPS — localhost é rejeitado (40002). */
export function isValidPagSeguroNotificationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!['https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getUsableNotificationUrl(): string | null {
  const { notificationUrl } = getPagSeguroConfig();
  return isValidPagSeguroNotificationUrl(notificationUrl) ? notificationUrl : null;
}

/**
 * PagBank sandbox rejeita quando o e-mail do comprador é igual ao da conta vendedora (40002).
 * Em sandbox, usa sufixo +pagbank no local-part. O e-mail real do usuário continua no PaymentRecord.
 */
export function preparePagSeguroCustomerEmail(email: string): string {
  const override = process.env.PAGSEGURO_BUYER_EMAIL?.trim().toLowerCase();
  if (override) return override;

  const normalized = email.toLowerCase().trim();
  const { apiUrl } = getPagSeguroConfig();
  const isSandbox = apiUrl.includes('sandbox');
  if (!isSandbox) return normalized;

  const at = normalized.indexOf('@');
  if (at <= 0) return normalized;

  const local = normalized.slice(0, at);
  const domain = normalized.slice(at + 1);
  if (local.includes('+pagbank')) return normalized;

  return `${local}+pagbank@${domain}`;
}

/** Testa se o token é aceito pelo PagBank (sem criar cobrança). */
export async function verifyPagSeguroCredentials(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const { token, apiUrl } = getPagSeguroConfig();
  if (!token) {
    return { ok: false, status: 0, message: 'PAGSEGURO_TOKEN não definido' };
  }

  try {
    const response = await fetch(`${apiUrl}/public-keys/card`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.ok) {
      return { ok: true, status: response.status, message: 'Token válido' };
    }

    if (response.status === 401) {
      return {
        ok: false,
        status: 401,
        message:
          'Token rejeitado pelo PagBank. Gere um novo em https://portaldev.pagbank.com.br/tokens (sandbox) e reinicie o servidor.',
      };
    }

    const text = await response.text();
    return {
      ok: false,
      status: response.status,
      message: `PagBank respondeu ${response.status}: ${text.slice(0, 200)}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Falha ao contactar PagBank',
    };
  }
}

function formatDueDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function formatPixExpirationDate(hoursFromNow = 24): string {
  const date = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}-03:00`;
}

function buildPaymentMethod(
  method: Exclude<PagSeguroPaymentMethod, 'pix'>,
  customer: PagSeguroCustomer
): Record<string, unknown> {
  const taxId =
    sanitizeTaxId(customer.taxId)
    ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);

  if (!taxId) {
    throw new Error('CPF ou CNPJ do pagador é obrigatório para boleto.');
  }

  if (method === 'boleto') {
    return {
      type: 'BOLETO',
      boleto: {
        due_date: formatDueDate(3),
        instruction_lines: {
          line_1: 'Pagamento referente a assinatura Recruta Industria',
          line_2: 'Nao receber apos o vencimento',
        },
        holder: {
          name: customer.name,
          tax_id: taxId,
          email: customer.email,
          address: {
            street: 'Av. Paulista',
            number: '1000',
            locality: 'Bela Vista',
            city: 'Sao Paulo',
            region: 'SP',
            region_code: 'SP',
            country: 'BRA',
            postal_code: '01310100',
          },
        },
      },
    };
  }

  return { type: 'CREDIT_CARD', installments: 1, capture: true };
}

function mapChargeStatus(status?: string): string {
  const normalized = (status || 'PENDING').toUpperCase();
  if (['PAID', 'AUTHORIZED', 'AVAILABLE'].includes(normalized)) return 'PAID';
  if (['DECLINED', 'CANCELED', 'CANCELLED'].includes(normalized)) return 'DECLINED';
  if (normalized === 'EXPIRED') return 'CANCELED';
  return 'PENDING';
}

function extractCheckoutUrl(charge: Record<string, unknown>): string | undefined {
  const links = charge.links as Array<{ rel?: string; href?: string }> | undefined;
  const payLink = links?.find(
    (link) =>
      link.rel === 'PAY' ||
      link.rel === 'CHECKOUT' ||
      link.href?.includes('checkout') ||
      link.href?.includes('pagseguro')
  );
  return payLink?.href;
}

export async function createPagSeguroPayment(
  input: CreatePagSeguroPaymentInput
): Promise<PagSeguroPaymentResult> {
  const { token, apiUrl, notificationUrl } = getPagSeguroConfig();
  if (!token) {
    throw new Error('PAGSEGURO_TOKEN não configurado');
  }

  const amount = Math.round(input.amount);
  if (!amount || amount < 100) {
    throw new Error('Valor inválido para cobrança');
  }

  const referenceId = `order-${Date.now()}`;
  const chargeReferenceId = `charge-${Date.now()}`;
  const itemName = input.description || 'Assinatura Recruta Industria';
  const customerEmail = preparePagSeguroCustomerEmail(input.customer.email);
  const customer = { ...input.customer, email: customerEmail };
  const taxId =
    sanitizeTaxId(customer.taxId)
    ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);

  if (!taxId) {
    throw new Error('CPF ou CNPJ do pagador é obrigatório. Complete seu cadastro antes de pagar.');
  }

  const payload: Record<string, unknown> = {
    reference_id: referenceId,
    customer: {
      name: customer.name,
      email: customer.email,
      tax_id: taxId,
    },
    items: [
      {
        reference_id: input.itemReference || 'recruta-plan',
        name: itemName,
        quantity: 1,
        unit_amount: amount,
      },
    ],
  };

  if (input.method === 'pix') {
    payload.qr_codes = [
      {
        amount: { value: amount },
        expiration_date: formatPixExpirationDate(24),
      },
    ];
  } else {
    payload.charges = [
      {
        reference_id: chargeReferenceId,
        description: itemName,
        amount: { value: amount, currency: 'BRL' },
        payment_method: buildPaymentMethod(input.method, customer),
      },
    ];
  }

  const usableNotificationUrl = isValidPagSeguroNotificationUrl(notificationUrl)
    ? notificationUrl
    : null;

  if (usableNotificationUrl) {
    payload.notification_urls = [usableNotificationUrl];
  }

  const response = await fetch(`${apiUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        'PagSeguro rejeitou o token (401). Gere um novo token sandbox em https://portaldev.pagbank.com.br/tokens, atualize PAGSEGURO_TOKEN no .env.local e reinicie o servidor (npm run dev).'
      );
    }
    if (response.status === 400 && responseText.includes('merchant email')) {
      throw new Error(
        'PagSeguro sandbox: use um e-mail de comprador diferente do e-mail da conta PagBank. ' +
        'Em testes, o sistema já ajusta automaticamente com +pagbank; se persistir, defina PAGSEGURO_BUYER_EMAIL no .env.local.'
      );
    }
    if (response.status === 400 && responseText.includes('notification')) {
      throw new Error(
        'URL de notificação inválida. Em localhost o webhook é omitido automaticamente — reinicie o servidor e tente de novo. Em produção use HTTPS público em PAGSEGURO_NOTIFICATION_URL.'
      );
    }
    throw new Error(`PagSeguro rejeitou a cobrança (${response.status}): ${responseText}`);
  }

  const data = JSON.parse(responseText) as {
    id?: string;
    charges?: Array<Record<string, unknown>>;
    qr_codes?: Array<{ id?: string; text?: string; expiration_date?: string }>;
    qr_code?: Array<{ id?: string; text?: string; expiration_date?: string }>;
  };

  if (input.method === 'pix') {
    const qrList = data.qr_codes || data.qr_code;
    const qr = qrList?.[0];

    if (!data.id || !qr?.text) {
      throw new Error('Resposta inválida do PagSeguro: QR Code Pix ausente');
    }

    const qrCodeDataUrl = await buildPixQrCodeDataUrl(qr.text);

    return {
      chargeId: String(data.id),
      orderId: data.id,
      status: 'PENDING',
      copyPasteKey: qr.text,
      qrCodeDataUrl,
      expiresAt: qr.expiration_date,
    };
  }

  const charge = data.charges?.[0];
  if (!charge?.id) {
    throw new Error('Resposta inválida do PagSeguro: chargeId ausente');
  }

  const paymentMethod = charge.payment_method as Record<string, unknown> | undefined;
  const boleto = paymentMethod?.boleto as
    | { barcode?: string; formatted_barcode?: string; pdf?: { href?: string } }
    | undefined;

  const result: PagSeguroPaymentResult = {
    chargeId: String(charge.id),
    orderId: data.id,
    status: mapChargeStatus(String(charge.status || 'PENDING')),
    line: boleto?.formatted_barcode || boleto?.barcode,
    boletoUrl: boleto?.pdf?.href || extractCheckoutUrl(charge),
    checkoutUrl: extractCheckoutUrl(charge),
  };

  if (input.method === 'boleto' && !result.line && !result.boletoUrl) {
    throw new Error('PagSeguro não retornou dados do boleto');
  }

  if (input.method === 'card' && !result.checkoutUrl) {
    throw new Error(
      'Pagamento com cartão requer checkout com cartão criptografado. Use Pix ou Boleto.'
    );
  }

  return result;
}

export async function getPagSeguroChargeStatus(paymentRef: string): Promise<{
  status: string;
  rawStatus?: string;
} | null> {
  const { token, apiUrl } = getPagSeguroConfig();
  if (!token) return null;

  const isOrderRef = paymentRef.startsWith('ORDE_');
  const endpoint = isOrderRef
    ? `${apiUrl}/orders/${paymentRef}`
    : `${apiUrl}/charges/${paymentRef}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return null;

    if (isOrderRef) {
      const data = (await response.json()) as {
        status?: string;
        charges?: Array<{ status?: string }>;
      };

      if (data.charges?.length) {
        const paid = data.charges.some((c) =>
          ['PAID', 'AUTHORIZED', 'AVAILABLE'].includes(String(c.status || '').toUpperCase()),
        );
        if (paid) {
          return { status: 'PAID', rawStatus: data.charges[0]?.status };
        }
        const chargeStatus = data.charges[0]?.status;
        if (chargeStatus) {
          return {
            status: mapChargeStatus(chargeStatus),
            rawStatus: chargeStatus,
          };
        }
      }

      if (data.status) {
        return {
          status: mapChargeStatus(data.status),
          rawStatus: data.status,
        };
      }

      return { status: 'PENDING', rawStatus: 'WAITING' };
    }

    const data = (await response.json()) as { status?: string };
    return {
      status: mapChargeStatus(data.status),
      rawStatus: data.status,
    };
  } catch {
    return null;
  }
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Extrai referência de cobrança/pedido de payloads PagBank. */
export function extractGatewayReference(payload: Record<string, unknown>): string | null {
  const direct = pickString(payload, 'reference_id', 'referenceId');
  if (direct) return direct;

  const id = pickString(payload, 'id');
  if (id && (id.startsWith('ORDE_') || id.startsWith('CHAR_'))) {
    return id;
  }

  const charges = payload.charges;
  if (Array.isArray(charges) && charges[0] && typeof charges[0] === 'object') {
    const chargeId = pickString(charges[0] as Record<string, unknown>, 'id');
    if (chargeId) return chargeId;
  }

  const data = payload.data;
  if (data && typeof data === 'object') {
    return extractGatewayReference(data as Record<string, unknown>);
  }

  return id;
}

export function extractGatewayStatus(payload: Record<string, unknown>): string | null {
  const status = pickString(payload, 'status');
  if (status) return status;

  const charges = payload.charges;
  if (Array.isArray(charges) && charges[0] && typeof charges[0] === 'object') {
    const chargeStatus = pickString(charges[0] as Record<string, unknown>, 'status');
    if (chargeStatus) return chargeStatus;
  }

  const data = payload.data;
  if (data && typeof data === 'object') {
    return extractGatewayStatus(data as Record<string, unknown>);
  }

  return null;
}

/** Consulta notificação PagBank (API de pedidos). */
export async function fetchPagBankNotification(
  notificationId: string,
): Promise<Record<string, unknown> | null> {
  const { token, apiUrl } = getPagSeguroConfig();
  if (!token || !notificationId) return null;

  try {
    const response = await fetch(`${apiUrl}/notifications/${notificationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
