import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/db'

async function findPaymentByExternal(externalId: string) {
  return await prisma.paymentRecord.findFirst({
    where: {
      reference: externalId
    }
  })
}

async function updatePayment(idOrExternal: string, patch: any) {
  return await prisma.paymentRecord.update({
    where: { reference: idOrExternal },
    data: patch
  }).catch(() => null)
}

// POST /api/pagbank/webhook
export async function POST(req: NextRequest) {
  const PAGBANK_WEBHOOK_SECRET = process.env.PAGBANK_WEBHOOK_SECRET

  const raw = await req.text()

  // Try verify signature if secret provided. Assumes HMAC-SHA256 header 'x-pagbank-signature'
  if (PAGBANK_WEBHOOK_SECRET) {
    const signature = req.headers.get('x-pagbank-signature') || req.headers.get('x-signature')
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
    }
    const hmac = crypto.createHmac('sha256', PAGBANK_WEBHOOK_SECRET).update(raw).digest('hex')
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let json: any = null
  try {
    json = JSON.parse(raw)
  } catch (e) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const event = json.event || json.type || json.eventType

  // Try map event to payment record
  const externalId = json.data?.id || json.data?.paymentId || json.data?.chargeId
  if (externalId) {
    const local = await findPaymentByExternal(externalId)
    if (local) {
      let newStatus = local.status
      if (['payment.paid', 'charge.paid', 'payment.completed', 'paid'].includes(event) || json.data?.status === 'PAID') {
        newStatus = 'PAID'
      } else if (['payment.failed', 'declined', 'canceled', 'cancelled'].includes(event) || ['DECLINED', 'CANCELED'].includes(json.data?.status)) {
        newStatus = 'FAILED'
      } else if (json.data?.status) {
        newStatus = json.data.status
      }
      await updatePayment(local.id, { status: newStatus, meta: JSON.stringify({ ...(local.meta ? JSON.parse(local.meta) : {}), webhook: json }) })
    }
  }

  return NextResponse.json({ received: true })
}
