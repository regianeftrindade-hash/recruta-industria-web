import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  mapStripePaymentStatus,
  parseStripeEvent,
  verifyStripeWebhookSignature,
  type StripeEvent,
} from "@/lib/payment/stripe-client";
import {
  activatePaidPayment,
  findPaymentRecordByGatewayRef,
} from "@/lib/payment/payment-activation";
import {
  asCompanyPaymentMeta,
  asProfessionalPaymentMeta,
  parsePaymentMeta,
} from "@/lib/payment/payment-config";
import { enforceApiRateLimit, getClientIp } from "@/lib/security/api-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook Stripe — produção:
 * https://www.recrutaindustria.com/api/stripe/webhook
 *
 * Eventos: checkout.session.completed, invoice.paid, invoice.payment_failed,
 * customer.subscription.updated, customer.subscription.deleted, charge.refunded
 *
 * Ativação somente após status PAID + validações de meta existentes.
 * Idempotência via event.id em meta.stripeEventId.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!(await enforceApiRateLimit(`webhook-stripe:${ip}`, 120, 60_000))) {
      return json({ error: "rate_limited" }, 429);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!verifyStripeWebhookSignature(rawBody, signature)) {
      console.error("[stripe/webhook] assinatura inválida");
      return json({ error: "unauthorized" }, 401);
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const event = parseStripeEvent(payload);
    if (!event) {
      return json({ error: "unrecognized_event" }, 400);
    }

    const already = await prisma.paymentRecord.findFirst({
      where: {
        OR: [
          { externalId: event.id },
          { meta: { contains: `"stripeEventId":"${event.id}"` } },
        ],
      },
      select: { id: true, status: true, reference: true },
    });
    if (already && already.status === "PAID") {
      return json({ ok: true, duplicate: true, activated: true });
    }

    switch (event.type) {
      case "checkout.session.completed":
        return handleCheckoutCompleted(event);
      case "invoice.paid":
        return handleInvoicePaid(event);
      case "invoice.payment_failed":
        return handleInvoiceFailed(event);
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return handleSubscriptionChange(event);
      case "charge.refunded":
        return handleRefund(event);
      default:
        return json({ ok: true, ignored: true, type: event.type });
    }
  } catch (error) {
    console.error("[stripe/webhook]", error);
    return json({ error: "internal" }, 500);
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function handleCheckoutCompleted(event: StripeEvent) {
  const obj = event.data.object;
  const sessionId = String(obj.id || "");
  const paymentStatus = String(obj.payment_status || "");
  const sessionStatus = String(obj.status || "");
  const clientRef = String(obj.client_reference_id || "");
  const metadata = (obj.metadata || {}) as Record<string, string>;
  const subscriptionId =
    typeof obj.subscription === "string"
      ? obj.subscription
      : (obj.subscription as { id?: string } | null)?.id || undefined;

  const mapped = mapStripePaymentStatus(paymentStatus, sessionStatus);

  let payment =
    (await findPaymentRecordByGatewayRef(sessionId)) ||
    (clientRef ? await findPaymentRecordByGatewayRef(clientRef) : null) ||
    (metadata.paymentReference
      ? await findPaymentRecordByGatewayRef(metadata.paymentReference)
      : null);

  if (!payment) {
    console.info("[stripe/webhook] checkout sem PaymentRecord", sessionId);
    return json({ ok: true, not_found: true });
  }

  const meta = parsePaymentMeta(payment.meta) || {};
  const nextMeta = {
    ...meta,
    stripeEventId: event.id,
    ...(subscriptionId ? { gatewaySubscriptionId: subscriptionId } : {}),
    provider: "stripe",
  };

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: mapped,
      meta: JSON.stringify(nextMeta),
      externalId: subscriptionId || payment.externalId || sessionId,
    },
  });

  let activated = false;
  if (mapped === "PAID") {
    const result = await activatePaidPayment(payment.reference);
    activated = result.activated;
  }

  return json({ ok: true, status: mapped, activated, eventId: event.id });
}

async function handleInvoicePaid(event: StripeEvent) {
  const obj = event.data.object;
  const subscriptionId =
    typeof obj.subscription === "string"
      ? obj.subscription
      : (obj.subscription as { id?: string } | null)?.id || "";
  const invoiceId = String(obj.id || "");
  const amountPaid = Number(obj.amount_paid ?? 0);
  const currency = String(obj.currency || "usd").toUpperCase();
  const metadata = (obj.metadata || {}) as Record<string, string>;
  const billingReason = String(obj.billing_reason || "");

  let payment =
    (subscriptionId ? await findPaymentRecordByGatewayRef(subscriptionId) : null) ||
    (metadata.paymentReference
      ? await findPaymentRecordByGatewayRef(metadata.paymentReference)
      : null);

  if (!payment && subscriptionId && billingReason === "subscription_cycle") {
    const parent = await prisma.paymentRecord.findFirst({
      where: {
        OR: [
          { externalId: subscriptionId },
          { meta: { contains: subscriptionId } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    if (parent) {
      const parentMeta = parsePaymentMeta(parent.meta) || {};
      const company = asCompanyPaymentMeta(parent.meta);
      const professional = asProfessionalPaymentMeta(parent.meta);
      if (company || professional) {
        const reference = `stripe_inv_${invoiceId}`;
        payment = await prisma.paymentRecord.create({
          data: {
            reference,
            amount: amountPaid / 100,
            currency,
            method: "card",
            customer: parent.customer,
            status: "PAID",
            meta: JSON.stringify({
              ...parentMeta,
              isRenewal: true,
              gatewaySubscriptionId: subscriptionId,
              stripeEventId: event.id,
              provider: "stripe",
            }),
            externalId: invoiceId,
          },
        });
        const result = await activatePaidPayment(reference);
        return json({
          ok: true,
          renewal: true,
          activated: result.activated,
          eventId: event.id,
        });
      }
    }
  }

  if (!payment) {
    return json({ ok: true, not_found: true });
  }

  const meta = parsePaymentMeta(payment.meta) || {};
  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      meta: JSON.stringify({
        ...meta,
        stripeEventId: event.id,
        gatewaySubscriptionId: subscriptionId || meta.gatewaySubscriptionId,
        provider: "stripe",
      }),
      externalId: invoiceId || payment.externalId,
    },
  });

  const result = await activatePaidPayment(payment.reference);
  return json({ ok: true, status: "PAID", activated: result.activated, eventId: event.id });
}

async function handleInvoiceFailed(event: StripeEvent) {
  const obj = event.data.object;
  const subscriptionId =
    typeof obj.subscription === "string"
      ? obj.subscription
      : (obj.subscription as { id?: string } | null)?.id || "";
  const payment = subscriptionId
    ? await findPaymentRecordByGatewayRef(subscriptionId)
    : null;
  if (payment && payment.status !== "PAID") {
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { status: "DECLINED" },
    });
  }
  return json({ ok: true, status: "DECLINED" });
}

async function handleSubscriptionChange(event: StripeEvent) {
  const obj = event.data.object;
  const subscriptionId = String(obj.id || "");
  const status = String(obj.status || "");
  const metadata = (obj.metadata || {}) as Record<string, string>;

  let payment = subscriptionId
    ? await findPaymentRecordByGatewayRef(subscriptionId)
    : null;

  // Fallback: paymentReference no metadata da assinatura (sem inventar registros).
  if (!payment && metadata.paymentReference) {
    payment = await findPaymentRecordByGatewayRef(metadata.paymentReference);
  }

  // Idempotente: evento órfão (sem PaymentRecord) não é erro nem reprocessamento.
  if (!payment) {
    console.info(
      "[stripe/webhook] subscription change sem PaymentRecord — ignorado",
      event.type,
      subscriptionId || "(sem id)",
    );
    return json({
      ok: true,
      ignored: true,
      reason: "no_payment_record",
      eventType: event.type,
      subscriptionId: subscriptionId || null,
    });
  }

  const shouldCancel =
    event.type === "customer.subscription.deleted" ||
    status === "canceled" ||
    status === "unpaid";

  if (shouldCancel) {
    if (payment.status === "CANCELED") {
      return json({
        ok: true,
        duplicate: true,
        status: "CANCELED",
        subscriptionStatus: status,
      });
    }
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: {
        status: "CANCELED",
        meta: JSON.stringify({
          ...(parsePaymentMeta(payment.meta) || {}),
          gatewaySubscriptionId: subscriptionId || undefined,
          stripeEventId: event.id,
          provider: "stripe",
          canceledVia: event.type,
        }),
      },
    });
    return json({ ok: true, status: "CANCELED", subscriptionStatus: status });
  }

  return json({ ok: true, subscriptionStatus: status });
}

async function handleRefund(event: StripeEvent) {
  const obj = event.data.object;
  const paymentIntent =
    typeof obj.payment_intent === "string"
      ? obj.payment_intent
      : (obj.payment_intent as { id?: string } | null)?.id || "";
  const chargeId = String(obj.id || "");

  const payment =
    (paymentIntent ? await findPaymentRecordByGatewayRef(paymentIntent) : null) ||
    (await findPaymentRecordByGatewayRef(chargeId));

  if (payment) {
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { status: "DECLINED" },
    });
  }
  return json({ ok: true, refunded: true });
}
