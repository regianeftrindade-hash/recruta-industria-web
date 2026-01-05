import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chargeId, externalId, status } = body

    if (!chargeId && !externalId) {
      return new Response(JSON.stringify({ error: 'chargeId or externalId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const id = chargeId || externalId
    
    // Procurar e atualizar pagamento
    const payment = await prisma.paymentRecord.findUnique({
      where: { reference: id }
    })

    if (!payment) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    await prisma.paymentRecord.update({
      where: { reference: id },
      data: {
        status: (status || 'PAID').toUpperCase(),
      }
    })

    return new Response(JSON.stringify({ ok: true, id, status: status || 'PAID' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
