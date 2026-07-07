import { randomUUID } from 'crypto';
import { getPagSeguroConfig, preparePagSeguroCustomerEmail } from '@/lib/pagseguro-client';
import { isSandboxMode, PAYMENT_CONFIG } from '@/lib/payment-config';
import type { BillingPeriod } from '@/lib/billing';
import { sanitizeTaxId, fallbackTaxIdForSandbox } from '@/lib/payment-tax';

export type SubscriptionCustomer = {
  name: string;
  email: string;
  taxId?: string;
  phone?: string;
};

export type CreateRecurringSubscriptionInput = {
  planReference: string;
  planName: string;
  description: string;
  amountCentavos: number;
  billingPeriod: BillingPeriod;
  customer: SubscriptionCustomer;
  subscriptionReference?: string;
  paymentMethod: 'boleto' | 'card';
};

export type RecurringSubscriptionResult = {
  subscriptionId: string;
  status: string;
  boletoUrl?: string;
  checkoutUrl?: string;
  planId: string;
};

function getSubscriptionsApiUrl(): string {
  const override = (
    process.env.PAGSEGURO_SUBSCRIPTIONS_API_URL
    || process.env.PAGBANK_SUBSCRIPTIONS_API_URL
    || ''
  ).trim();

  if (override) return override.replace(/\/$/, '');

  return isSandboxMode()
    ? PAYMENT_CONFIG.sandboxSubscriptionsApiUrl
    : PAYMENT_CONFIG.productionSubscriptionsApiUrl;
}

async function pagBankSubscriptionsFetch(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<Response> {
  const { token } = getPagSeguroConfig();
  if (!token) throw new Error('PAGSEGURO_TOKEN não configurado');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.idempotencyKey) {
    headers['x-idempotency-key'] = init.idempotencyKey;
  }

  const { idempotencyKey: _ignored, ...rest } = init;
  return fetch(`${getSubscriptionsApiUrl()}${path}`, {
    ...rest,
    headers,
    cache: 'no-store',
  });
}

function intervalForPeriod(period: BillingPeriod): { unit: 'MONTH' | 'YEAR'; length: number } {
  return period === 'annual'
    ? { unit: 'YEAR', length: 1 }
    : { unit: 'MONTH', length: 1 };
}

function defaultPhone(): { country: string; area: string; number: string } {
  return { country: '55', area: '11', number: '999999999' };
}

function defaultAddress() {
  return {
    street: 'Av Paulista',
    number: '1000',
    locality: 'Bela Vista',
    city: 'Sao Paulo',
    region_code: 'SP',
    postal_code: '01310100',
    country: 'BRA',
  };
}

function extractLink(
  links: Array<{ rel?: string; href?: string }> | undefined,
  rel: string,
): string | undefined {
  return links?.find((l) => l.rel === rel)?.href;
}

export async function createPagBankPlan(input: {
  referenceId: string;
  name: string;
  description: string;
  amountCentavos: number;
  billingPeriod: BillingPeriod;
  paymentMethods?: Array<'BOLETO' | 'CREDIT_CARD'>;
}): Promise<{ planId: string }> {
  const interval = intervalForPeriod(input.billingPeriod);
  const response = await pagBankSubscriptionsFetch('/plans', {
    method: 'POST',
    idempotencyKey: `plan-${input.referenceId}-${randomUUID()}`,
    body: JSON.stringify({
      reference_id: input.referenceId.slice(0, 65),
      name: input.name.slice(0, 65),
      description: input.description.slice(0, 250),
      amount: {
        value: input.amountCentavos,
        currency: 'BRL',
      },
      interval,
      payment_method: input.paymentMethods ?? ['BOLETO', 'CREDIT_CARD'],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`PagBank plano (${response.status}): ${text.slice(0, 300)}`);
  }

  const data = JSON.parse(text) as { id?: string };
  if (!data.id) throw new Error('PagBank não retornou ID do plano');
  return { planId: data.id };
}

export async function createPagBankRecurringSubscription(
  input: CreateRecurringSubscriptionInput,
): Promise<RecurringSubscriptionResult> {
  const taxId =
    sanitizeTaxId(input.customer.taxId)
    ?? (isSandboxMode() ? fallbackTaxIdForSandbox() : undefined);

  if (!taxId) {
    throw new Error('CPF ou CNPJ é obrigatório para assinatura recorrente.');
  }

  const { planId } = await createPagBankPlan({
    referenceId: input.planReference,
    name: input.planName,
    description: input.description,
    amountCentavos: input.amountCentavos,
    billingPeriod: input.billingPeriod,
    paymentMethods: input.paymentMethod === 'boleto'
      ? ['BOLETO']
      : ['CREDIT_CARD'],
  });

  const email = preparePagSeguroCustomerEmail(input.customer.email);
  const phoneDigits = (input.customer.phone || '').replace(/\D/g, '');
  const phone = phoneDigits.length >= 10
    ? {
        country: '55',
        area: phoneDigits.slice(0, 2),
        number: phoneDigits.slice(2),
      }
    : defaultPhone();

  const payload: Record<string, unknown> = {
    reference_id: (input.subscriptionReference || `sub-${Date.now()}`).slice(0, 65),
    plan: { id: planId },
    customer: {
      reference_id: `cust-${taxId}`.slice(0, 65),
      name: input.customer.name.slice(0, 150),
      email,
      tax_id: taxId,
      phones: [phone],
      address: defaultAddress(),
    },
    payment_method: [
      input.paymentMethod === 'boleto'
        ? { type: 'BOLETO' }
        : { type: 'CREDIT_CARD', card: { security_code: 123 } },
    ],
  };

  const response = await pagBankSubscriptionsFetch('/subscriptions', {
    method: 'POST',
    idempotencyKey: `sub-${input.subscriptionReference || Date.now()}-${randomUUID()}`,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  if (!response.ok) {
    if (input.paymentMethod === 'card') {
      throw new Error(
        'Assinatura com cartão requer tokenização PagBank. Use boleto recorrente ou pagamento único Pix/Boleto.',
      );
    }
    throw new Error(`PagBank assinatura (${response.status}): ${text.slice(0, 400)}`);
  }

  const data = JSON.parse(text) as {
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string }>;
  };

  if (!data.id) throw new Error('PagBank não retornou ID da assinatura');

  let boletoUrl: string | undefined;
  let checkoutUrl: string | undefined;

  const invoiceLink = extractLink(data.links, 'INVOICES.LAST')
    || extractLink(data.links, 'INVOICE');

  if (invoiceLink) {
    try {
      const invoicePath = invoiceLink.startsWith('http')
        ? invoiceLink
        : `${getSubscriptionsApiUrl()}${invoiceLink.startsWith('/') ? '' : '/'}${invoiceLink}`;
      const invoiceRes = await fetch(invoicePath, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getPagSeguroConfig().token}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      if (invoiceRes.ok) {
        const invoice = await invoiceRes.json() as {
          links?: Array<{ rel?: string; href?: string }>;
          charges?: Array<{ links?: Array<{ rel?: string; href?: string }> }>;
        };
        boletoUrl = extractLink(invoice.links, 'PAY')
          || extractLink(invoice.charges?.[0]?.links, 'PAY');
        checkoutUrl = boletoUrl;
      }
    } catch {
      /* fatura opcional no retorno imediato */
    }
  }

  return {
    subscriptionId: data.id,
    status: String(data.status || 'PENDING').toUpperCase(),
    boletoUrl,
    checkoutUrl,
    planId,
  };
}

export async function getPagBankSubscriptionStatus(subscriptionId: string): Promise<{
  status: string;
  rawStatus?: string;
} | null> {
  if (!subscriptionId.startsWith('SUBS_')) return null;

  try {
    const response = await pagBankSubscriptionsFetch(`/subscriptions/${subscriptionId}`, {
      method: 'GET',
    });
    if (!response.ok) return null;

    const data = await response.json() as { status?: string };
    const raw = String(data.status || 'PENDING').toUpperCase();
    const paid = ['ACTIVE', 'APPROVED', 'PAID'].includes(raw);
    const failed = ['SUSPENDED', 'CANCELED', 'CANCELLED', 'OVERDUE', 'EXPIRED'].includes(raw);

    return {
      status: paid ? 'PAID' : failed ? 'DECLINED' : 'PENDING',
      rawStatus: raw,
    };
  } catch {
    return null;
  }
}

export function isPagBankSubscriptionId(ref: string): boolean {
  return ref.startsWith('SUBS_');
}
