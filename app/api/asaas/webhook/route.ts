import { NextRequest } from 'next/server';
import {
  extractAsaasPaymentId,
  extractAsaasPaymentStatus,
  mapAsaasPaymentStatus,
} from '@/lib/payment/asaas-client';
import {
  findPaymentRecordByGatewayRef,
  syncPaymentStatusFromGateway,
} from '@/lib/payment-activation';
import { enforceApiRateLimit, getClientIp } from '@/lib/security/api-guard';
import { matchWebhookSecret } from '@/lib/security/webhook-auth';

function isValidAsaasWebhookToken(request: NextRequest): boolean {
  return matchWebhookSecret({
    request,
    expected:
      process.env.ASAAS_WEBHOOK_TOKEN?.trim() || process.env.ASAAS_WEBHOOK_SECRET?.trim(),
    headerNames: ['asaas-access-token', 'x-asaas-access-token'],
    // Compat temporária: só se WEBHOOK_ALLOW_QUERY_SECRET=true em produção.
    queryParam: 'token',
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await enforceApiRateLimit(`webhook-asaas:${ip}`, 120, 60_000))) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isValidAsaasWebhookToken(req)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const paymentId = extractAsaasPaymentId(body);
    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true, ignored: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payment = await findPaymentRecordByGatewayRef(paymentId);
    if (!payment) {
      return new Response(JSON.stringify({ ok: true, not_found: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawStatus = extractAsaasPaymentStatus(body);
    if (rawStatus) {
      const mapped = mapAsaasPaymentStatus(rawStatus);
      if (payment.status !== mapped) {
        const { prisma } = await import('@/lib/db');
        await prisma.paymentRecord.update({
          where: { id: payment.id },
          data: { status: mapped },
        });
      }
    }

    const { status, activated } = await syncPaymentStatusFromGateway(payment.reference);

    return new Response(JSON.stringify({ ok: true, status, activated }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[webhook asaas]', error);
    return new Response(JSON.stringify({ error: 'internal' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
