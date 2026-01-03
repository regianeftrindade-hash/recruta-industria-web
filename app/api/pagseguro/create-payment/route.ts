import { NextRequest } from 'next/server'
import fs from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'payments.json')

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, method = 'pix', customer, meta } = body

    if (!amount) {
      return new Response(JSON.stringify({ error: 'amount is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const now = new Date().toISOString()
    const rec = {
      id: randomUUID(),
      amount,
      currency: 'BRL',
      method,
      customer: customer || {},
      status: 'PENDING',
      meta: meta || {},
      createdAt: now,
      updatedAt: now,
    }

    const all = await readAll()
    all.push(rec)
    await writeAll(all)

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    if (method === 'pix') {
      return new Response(
        JSON.stringify({ id: rec.id, chargeId: rec.id, copyPasteKey: `PIX:${rec.id}`, expiresAt, status: rec.status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (method === 'boleto') {
      return new Response(
        JSON.stringify({ id: rec.id, chargeId: rec.id, boletoUrl: `/api/pagseguro/boleto/${rec.id}`, line: `34191.79001 01043.510047 91000.000002 1  ${rec.id.slice(0,10)}`, expiresAt, status: rec.status }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ id: rec.id, chargeId: rec.id, checkoutUrl: `/api/pagseguro/checkout/${rec.id}`, status: rec.status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
