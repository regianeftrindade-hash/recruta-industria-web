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
        amount,
        currency,
        method: 'card',
        status: 'PENDING',
        customer: JSON.stringify(customer || {}),
        meta: '{}'
      }
    })
  } catch (err) {
    console.error('Error creating payment record:', err)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const checkoutUrl = `https://checkout.pagbank.example/checkout/${id}`

  return NextResponse.json({ id: rec.reference, checkoutUrl })
}
