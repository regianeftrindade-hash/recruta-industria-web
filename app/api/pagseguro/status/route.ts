import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.PAGBANK_API_URL || 'https://api.pagbank.com.br'

async function getPagBankStatus(chargeId: string) {
  try {
    const response = await fetch(`${PAGBANK_API_URL}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('PagBank Status Error:', response.status)
      return null
    }

    const data = await response.json()
    
    // Mapear status do PagBank para nosso padrão
    let status = 'PENDING'
    if (data.status === 'PAID') status = 'PAID'
    else if (data.status === 'DECLINED') status = 'DECLINED'
    else if (data.status === 'CANCELED') status = 'CANCELED'
    else if (data.status === 'EXPIRED') status = 'EXPIRED'

    return { status, pagbankData: data }
  } catch (error) {
    console.error('PagBank integration error:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const chargeId = url.searchParams.get('chargeId')
    if (!chargeId) {
      return new Response(JSON.stringify({ error: 'chargeId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const rec = await prisma.paymentRecord.findFirst({
      where: {
        reference: {
          in: [chargeId]
        }
      }
    })

    if (!rec) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    // Buscar status real do PagBank
    const pagbankStatus = await getPagBankStatus(rec.reference)
    
    let status = rec.status
    if (pagbankStatus) {
      status = pagbankStatus.status
      // Atualizar status local se mudou
      if (rec.status !== status) {
        await prisma.paymentRecord.update({
          where: { id: rec.id },
          data: { status }
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        id: rec.reference, 
        reference: rec.reference,
        status: status, 
        amount: rec.amount,
        currency: rec.currency,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
