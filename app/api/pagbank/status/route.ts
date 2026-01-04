import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/pagbank/status?chargeId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const chargeId = searchParams.get('chargeId')

  if (!chargeId) {
    return NextResponse.json({ error: 'Missing chargeId' }, { status: 400 })
  }

  const rec = await prisma.paymentRecord.findFirst({
    where: {
      reference: chargeId
    }
  })

  if (rec) {
    return NextResponse.json({ id: rec.id, status: rec.status, data: rec.data })
  }

  // Fallback to external API if configured
  const PAGBANK_API_URL = process.env.PAGBANK_API_URL || 'https://api.pagbank.com'
  const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
  if (!PAGBANK_TOKEN) {
    return NextResponse.json({ error: 'Payment not found locally and no PAGBANK_TOKEN configured' }, { status: 404 })
  }

  try {
    const resp = await fetch(`${PAGBANK_API_URL}/payments/${encodeURIComponent(chargeId)}`, {
      headers: { Authorization: `Bearer ${PAGBANK_TOKEN}` },
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'request failed' }, { status: 500 })
  }
}
