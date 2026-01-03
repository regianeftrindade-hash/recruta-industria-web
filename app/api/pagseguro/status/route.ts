import { NextRequest } from 'next/server'
import fs from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'payments.json')
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.PAGBANK_API_URL || 'https://api.pagbank.com.br'

async function readAll() {
  try {
    await fs.promises.access(DATA_FILE)
  } catch (e) {
    return []
  }
  const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
  return JSON.parse(txt || '[]')
}

async function writeAll(items: any[]) {
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(items, null, 2))
}

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

    const all = await readAll()
    const rec = all.find((p: any) => p.id === chargeId || p.chargeId === chargeId || p.pagbankId === chargeId) || null

    if (!rec) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    // Buscar status real do PagBank
    const pagbankStatus = await getPagBankStatus(rec.pagbankId || chargeId)
    
    let status = rec.status
    if (pagbankStatus) {
      status = pagbankStatus.status
      // Atualizar status local se mudou
      if (rec.status !== status) {
        rec.status = status
        rec.updatedAt = new Date().toISOString()
        const idx = all.findIndex((p: any) => p.id === rec.id)
        if (idx >= 0) {
          all[idx] = rec
          await writeAll(all)
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        id: rec.id, 
        chargeId: rec.chargeId,
        status: status, 
        amount: rec.amount, 
        method: rec.method, 
        meta: rec.meta,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
