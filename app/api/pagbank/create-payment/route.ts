import { NextRequest, NextResponse } from 'next/server'
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
    const { amount, currency = 'BRL', method = 'pix', customer, meta } = body || {}
    if (!amount) return NextResponse.json({ error: 'Missing amount' }, { status: 400 })

    const now = new Date().toISOString()
    const rec = {
      id: randomUUID(),
      amount,
      currency,
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

    if (method === 'pix') {
      return NextResponse.json({ id: rec.id, chargeId: rec.id, copyPasteKey: `PIX:${rec.id}`, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), status: rec.status })
    }
    if (method === 'boleto') {
      return NextResponse.json({ id: rec.id, chargeId: rec.id, boletoUrl: `/api/pagbank/boleto/${rec.id}`, line: `34191.79001 01043.510047 91000.000002 1  ${rec.id.slice(0,10)}`, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), status: rec.status })
    }
    return NextResponse.json({ id: rec.id, chargeId: rec.id, checkoutUrl: `/api/pagbank/checkout/${rec.id}`, status: rec.status })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'unexpected' }, { status: 500 })
  }
}
