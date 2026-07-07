import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  extractGatewayReference,
  extractGatewayStatus,
  fetchPagBankNotification,
} from '@/lib/pagseguro-client';
import {
  findPaymentRecordByGatewayRef,
  syncPaymentStatusFromGateway,
} from '@/lib/payment-activation';

function mapWebhookStatus(status?: string): string {
  const normalized = (status || 'PENDING').toUpperCase();
  if (['PAID', 'AUTHORIZED', 'AVAILABLE'].includes(normalized)) return 'PAID';
  if (['DECLINED', 'CANCELED', 'CANCELLED'].includes(normalized)) return 'DECLINED';
  if (normalized === 'EXPIRED') return 'CANCELED';
  return 'PENDING';
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, unknown> = {};

    if (contentType.includes('application/json')) {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const notificationCode = params.get('notificationCode');
      if (notificationCode) body.notificationCode = notificationCode;
      const notificationType = params.get('notificationType');
      if (notificationType) body.notificationType = notificationType;
    }

    const notificationId = String(
      body.id
      || body.notification_id
      || body.notificationCode
      || '',
    ).trim();

    let gatewayRef = extractGatewayReference(body);
    let rawStatus = extractGatewayStatus(body);

    if (notificationId) {
      const notification = await fetchPagBankNotification(notificationId);
      if (notification) {
        gatewayRef = extractGatewayReference(notification) || gatewayRef;
        rawStatus = extractGatewayStatus(notification) || rawStatus;
      }
    }

    if (!gatewayRef) {
      return new Response(JSON.stringify({ error: 'reference_required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payment = await findPaymentRecordByGatewayRef(gatewayRef);
    if (!payment) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (rawStatus) {
      const mapped = mapWebhookStatus(rawStatus);
      if (payment.status !== mapped) {
        await prisma.paymentRecord.update({
          where: { id: payment.id },
          data: { status: mapped },
        });
      }
    }

    const { status, activated } = await syncPaymentStatusFromGateway(payment.reference);

    return new Response(
      JSON.stringify({
        ok: true,
        reference: payment.reference,
        status,
        activated,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unexpected';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
