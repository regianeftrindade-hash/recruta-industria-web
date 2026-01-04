import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

// POST /api/pagbank/card-session
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amount, currency = 'BRL', customer } = body || {}
  if (!amount) return NextResponse.json({ error: 'Missing amount' }, { status: 400 })

  const now = new Date().toISOString()
  const id = randomUUID()
  const rec = {
    reference: id,
    amount,
    currency,
    method: 'card',
    customer: customer || {},
    status: 'PENDING',
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

  const checkoutUrl = `https://checkout.pagbank.example/checkout/${id}`
  if (idx !== -1) { all[idx].meta = { checkoutUrl }; all[idx].updatedAt = new Date().toISOString(); await writeAll(all) }

  return NextResponse.json({ id: rec.id, checkoutUrl })
}
