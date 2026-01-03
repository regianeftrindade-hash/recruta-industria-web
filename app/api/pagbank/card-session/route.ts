import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_FILE = join(process.cwd(), 'data', 'payments.json')

async function ensureFile() {
  const dir = join(process.cwd(), 'data')
  try { await fs.promises.access(dir) } catch (e) { await fs.promises.mkdir(dir, { recursive: true }) }
  try { await fs.promises.access(DATA_FILE) } catch (e) { await fs.promises.writeFile(DATA_FILE, '[]') }
}

async function readAll() {
  await ensureFile()
  const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
  return JSON.parse(txt || '[]')
}

async function writeAll(items: any[]) {
  await ensureFile()
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8')
}

// POST /api/pagbank/card-session
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { amount, currency = 'BRL', customer } = body || {}
  if (!amount) return NextResponse.json({ error: 'Missing amount' }, { status: 400 })

  const now = new Date().toISOString()
  const rec = {
    id: randomUUID(),
    amount,
    currency,
    method: 'card',
    customer: customer || {},
    status: 'PENDING',
    meta: {},
    createdAt: now,
    updatedAt: now,
  }

  const all = await readAll()
  all.push(rec)
  await writeAll(all)

  const checkoutUrl = `https://checkout.pagbank.example/checkout/${rec.id}`
  // update meta
  const idx = all.findIndex((p: any) => p.id === rec.id)
  if (idx !== -1) { all[idx].meta = { checkoutUrl }; all[idx].updatedAt = new Date().toISOString(); await writeAll(all) }

  return NextResponse.json({ id: rec.id, checkoutUrl })
}
