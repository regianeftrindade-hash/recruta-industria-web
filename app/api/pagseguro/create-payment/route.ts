import { NextRequest } from 'next/server'
import fs from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'payments.json')
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN
const PAGBANK_API_URL = process.env.PAGBANK_API_URL || 'https://api.pagbank.com.br'

async function ensureFile() {
  try {
    await fs.promises.access(DATA_DIR)
  } catch (e) {
    await fs.promises.mkdir(DATA_DIR, { recursive: true })
  }
  try {
    await fs.promises.access(DATA_FILE)
  } catch (e) {
    await fs.promises.writeFile(DATA_FILE, '[]')
  }
}

async function readAll() {
  await ensureFile()
  const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
  return JSON.parse(txt || '[]')
}

async function writeAll(items: any[]) {
  await ensureFile()
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(items, null, 2))
}

async function createPagBankCharge(amount: number, method: string, customer: any) {
  try {
    const chargeData = {
      amount: Math.round(amount),
      customer: {
        name: customer.name || 'Cliente',
        email: customer.email || 'cliente@example.com',
        tax_id: customer.taxId || '00000000000000'
      },
      reference_id: randomUUID(),
      metadata: {
        method: method
      }
    }

    const response = await fetch(`${PAGBANK_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chargeData)
    })

    if (!response.ok) {
      console.error('PagBank API Error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('PagBank integration error:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, method = 'pix', customer, meta } = body

    if (!amount) {
      return new Response(JSON.stringify({ error: 'amount is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    // Criar cobrança no PagBank
    const pagbankCharge = await createPagBankCharge(amount, method, customer)

    const now = new Date().toISOString()
    const rec = {
      id: pagbankCharge?.id || randomUUID(),
      chargeId: pagbankCharge?.id || randomUUID(),
      amount,
      currency: 'BRL',
      method,
      customer: customer || {},
      status: pagbankCharge ? 'PENDING' : 'ERROR',
      pagbankId: pagbankCharge?.id,
      meta: meta || {},
      createdAt: now,
      updatedAt: now,
    }

    const all = await readAll()
    all.push(rec)
    await writeAll(all)

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Se falhar PagBank, retornar erro
    if (!pagbankCharge) {
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', chargeId: rec.chargeId, status: 'ERROR' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'pix' && pagbankCharge.qr_codes) {
      const pixData = pagbankCharge.qr_codes[0]
      return new Response(
        JSON.stringify({ 
          id: rec.id, 
          chargeId: rec.chargeId, 
          copyPasteKey: pixData.id, 
          qrCodeUrl: pixData.url,
          expiresAt, 
          status: rec.status 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'boleto' && pagbankCharge.boleto) {
      return new Response(
        JSON.stringify({ 
          id: rec.id, 
          chargeId: rec.chargeId, 
          boletoUrl: pagbankCharge.boleto.url,
          line: pagbankCharge.boleto.barcode, 
          expiresAt, 
          status: rec.status 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'card' && pagbankCharge.checkout) {
      return new Response(
        JSON.stringify({ 
          id: rec.id, 
          chargeId: rec.chargeId, 
          checkoutUrl: pagbankCharge.checkout.redirect_url || `https://checkout.pagbank.com.br/?id=${rec.chargeId}`, 
          status: rec.status 
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Fallback padrão
    return new Response(
      JSON.stringify({ 
        id: rec.id, 
        chargeId: rec.chargeId, 
        status: rec.status,
        pagbankData: pagbankCharge
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
    }

    return new Response(
      JSON.stringify({ id: rec.id, chargeId: rec.id, checkoutUrl: `https://checkout.pagseguro.com/?id=${rec.id}`, status: rec.status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
