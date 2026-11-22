import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  mapStripePaymentStatus,
  parseStripeEvent,
  verifyStripeWebhookSignature,
  type StripeEvent,
} from "@/lib/payment/stripe-client";
import { activatePaidPayment } from "@/lib/payment/payment-activation";
import { findPaymentRecordByGatewayRef } from "@/lib/payment/payment-activation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

/**
 * Stripe webhook — checkout.session.completed, invoice.paid, etc.
 * Idempotente via event.id em meta.stripeEventId.
 * Assinatura HMAC obrigatória (STRIPE_WEBHOOK_SECRET).
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET missing");
    return json({ error: "Webhook not configured" }, 503);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing stripe-signature" }, 400);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return json({ error: "Invalid body" }, 400);
  }

  let event: StripeEvent;
  try {
    const verified = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    if (!verified) {
      return json({ error: "Invalid signature" }, 400);
    }
    const parsed = parseStripeEvent(JSON.parse(rawBody));
    if (!parsed) {
      return json({ error: "Invalid event payload" }, 400);
    }
    event = parsed;
  } catch (err) {
    console.error("[stripe/webhook] signature/parse error", err);
    return json({ error: "Signature verification failed" }, 400);
  }

  // Idempotency: skip if we already processed this event
  const existing = await prisma.paymentRecord.findFirst({
    where: {
      meta: { contains: event.id },
    },
    select: { id: true, status: true },
  });
  if (existing && existing.status === "PAID") {
    return json({ ok: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        return await handleCheckoutCompleted(event);
      case "invoice.paid":
        return await handleInvoicePaid(event);
      case "invoice.payment_failed":
        return await handleInvoiceFailed(event);
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return json({ ok: true, ignored: event.type });
      case "charge.refunded":
        return await handleChargeRefunded(event);
      default:
        return json({ ok: true, ignored: event.type });
    }
  } catch (err) {
    console.error("[stripe/webhook] handler error", event.type, err);
    return json({ error: "Handler failed" }, 500);
  }
}

async function handleCheckoutCompleted(event: StripeEvent) {
  const session = event.data?.object as {
    id?: string;
    payment_status?: string;
    status?: string;
    client_reference_id?: string;
    metadata?: Record<string, string>;
    subscription?: string;
  } | null;
  if (!session?.id) return json({ error: "No session" }, 400);

  const paymentStatus = mapStripePaymentStatus(
    session.payment_status || "",
    session.status || "",
  );
  if (paymentStatus !== "PAID") {
    return json({ ok: true, status: paymentStatus });
  }

  const ref = session.id;
  let payment = await findPaymentRecordByGatewayRef(ref);
  if (!payment && session.client_reference_id) {
    payment = await findPaymentRecordByGatewayRef(session.client_reference_id);
  }
  if (!payment && session.metadata?.paymentRecordId) {
    payment = await prisma.paymentRecord.findUnique({
      where: { id: session.metadata.paymentRecordId },
    });
  }

  if (!payment) {
    console.warn("[stripe/webhook] payment record not found for", ref);
    return json({ ok: true, warning: "record_not_found" });
  }

  if (payment.status === "PAID") {
    return json({ ok: true, alreadyPaid: true });
  }

  // Merge event id into meta for idempotency
  let meta: Record<string, unknown> = {};
  try {
    meta = payment.meta ? JSON.parse(payment.meta) : {};
  } catch {
    meta = {};
  }
  meta.stripeEventId = event.id;
  meta.provider = "stripe";
  if (session.subscription) {
    meta.gatewaySubscriptionId = session.subscription;
  }

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      gatewayPaymentId: ref,
      meta: JSON.stringify(meta),
      paidAt: new Date(),
    },
  });

  await activatePaidPayment(payment.id);
  return json({ ok: true, activated: true, paymentId: payment.id });
}

async function handleInvoicePaid(event: StripeEvent) {
  const invoice = event.data?.object as {
    id?: string;
    subscription?: string;
    payment_intent?: string;
  } | null;
  if (!invoice) return json({ ok: true });

  const subId = invoice.subscription;
  if (!subId) return json({ ok: true, no_subscription: true });

  const payment = await findPaymentRecordByGatewayRef(subId);
  if (!payment) {
    return json({ ok: true, warning: "subscription_record_not_found" });
  }

  if (payment.status === "PAID") {
    return json({ ok: true, alreadyPaid: true });
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = payment.meta ? JSON.parse(payment.meta) : {};
  } catch {
    meta = {};
  }
  meta.stripeEventId = event.id;
  meta.isRenewal = true;
  meta.provider = "stripe";

  await prisma.paymentRecord.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      meta: JSON.stringify(meta),
      paidAt: new Date(),
    },
  });

  await activatePaidPayment(payment.id);
  return json({ ok: true, renewal: true, paymentId: payment.id });
}

async function handleInvoiceFailed(event: StripeEvent) {
  const invoice = event.data?.object as { subscription?: string } | null;
  if (!invoice?.subscription) return json({ ok: true });
  const payment = await findPaymentRecordByGatewayRef(invoice.subscription);
  if (payment && payment.status !== "PAID") {
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }
  return json({ ok: true, failed: true });
}

async function handleChargeRefunded(event: StripeEvent) {
  const charge = event.data?.object as { payment_intent?: string; id?: string } | null;
  if (!charge) return json({ ok: true });
  const ref = charge.payment_intent || charge.id;
  if (!ref) return json({ ok: true });
  const payment = await findPaymentRecordByGatewayRef(ref);
  if (payment) {
    await prisma.paymentRecord.update({
      where: { id: payment.id },
      data: { status: "DECLINED" },
    });
  }
  return json({ ok: true, refunded: true });
}
