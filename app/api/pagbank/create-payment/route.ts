import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = 'BRL', method = 'pix', customer, meta } = body || {}
    if (!amount) return NextResponse.json({ error: 'Missing amount' }, { status: 400 })

    const now = new Date().toISOString()
    const id = randomUUID()
    const rec = {
      id,
      amount,
      currency,
      method,
      customer: customer || {},
      status: 'PENDING',
      meta: meta || {},
      createdAt: now,
      updatedAt: now,
    }

    try {
      await prisma.paymentRecord.create({
        data: {
          reference: id,
          status: 'PENDING',
          data: rec
        }
      })
    } catch (err) {
      console.error('Error creating payment record:', err)
      return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
    }

    if (method === 'pix') {
      return NextResponse.json({ id: id, chargeId: id, copyPasteKey: `PIX:${id}`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), status: rec.status })
    }
    if (method === 'boleto') {
      return NextResponse.json({ id: id, chargeId: id, boletoUrl: `/api/pagbank/boleto/${id}`, line: `34191.79001 01043.510047 91000.000002 1  ${id.slice(0,10)}`, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: rec.status })
    }
    return NextResponse.json({ id: id, chargeId: id, checkoutUrl: `/api/pagbank/checkout/${id}`, status: rec.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unexpected' }, { status: 500 })
  }
}
