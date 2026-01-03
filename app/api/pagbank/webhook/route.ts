import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'payments.json')

async function readAll(): Promise<any[]> {
  try {
    await fs.promises.access(DATA_FILE)
  } catch (e) {
    return []
  }
  const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
  try {
    return JSON.parse(txt || '[]')
  } catch (e) {
    return []
  }
}

async function writeAll(items: any[]) {
  await fs.promises.mkdir(join(process.cwd(), 'data'), { recursive: true })
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8')
}

async function findPaymentByExternal(externalId: string) {
  const all = await readAll()
  return all.find((p) => p.id === externalId || p.externalId === externalId)
}

async function updatePayment(idOrExternal: string, patch: any) {
  const all = await readAll()
  const idx = all.findIndex((p: any) => p.id === idOrExternal || p.externalId === idOrExternal)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() }
  await writeAll(all)
  return all[idx]
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
      await updatePayment(local.id, { status: newStatus, meta: { ...(local.meta || {}), webhook: json } })
    }
  }

  return NextResponse.json({ received: true })
}
