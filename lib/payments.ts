import fs from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
// Do not statically import ./db to avoid bundlers resolving native/wasm deps at build-time
async function loadDb() {
  const modPath = './' + 'db'
  // create a dynamic import function so bundlers can't statically analyze the target
  // eslint-disable-next-line no-new-func
  const dynImport = new Function('p', 'return import(p)')
  return await dynImport(modPath)
}

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'payments.json')

type PaymentRecord = {
  id: string
  externalId?: string
  amount: number
  currency: string
  method: string
  customer?: any
  status: string
  meta?: any
  createdAt: string
  updatedAt: string
}

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

async function readAll(): Promise<PaymentRecord[]> {
  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const stmt = dbmod.dbPrepare('SELECT * FROM payments')
    const rows = stmt.all()
    return rows.map((r: any) => ({
      ...r,
      amount: Number(r.amount),
      customer: r.customer ? JSON.parse(r.customer) : {},
      meta: r.meta ? JSON.parse(r.meta) : {},
    }))
  }
  // Fallback: return empty array if database not available and file system is read-only
  try {
    await ensureFile()
    const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
    return JSON.parse(txt || '[]')
  } catch (e) {
    console.warn('Could not read payments from file system:', e)
    return []
  }
}

async function writeAll(items: PaymentRecord[]) {
  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const insert = dbmod.dbPrepare(`INSERT OR REPLACE INTO payments (id, externalId, amount, currency, method, customer, status, meta, createdAt, updatedAt) VALUES (@id,@externalId,@amount,@currency,@method,@customer,@status,@meta,@createdAt,@updatedAt)`)
    const del = dbmod.dbPrepare('DELETE FROM payments')
    // simple strategy: clear and reinsert
    del.run()
    const tx = items.map((it) => insert.run({
      id: it.id,
      externalId: it.externalId || null,
      amount: it.amount,
      currency: it.currency,
      method: it.method,
      customer: JSON.stringify(it.customer || {}),
      status: it.status,
      meta: JSON.stringify(it.meta || {}),
      createdAt: it.createdAt,
      updatedAt: it.updatedAt,
    }))
    return
  }
  // Only try to write to file system if it's writable, otherwise just log warning
  try {
    await ensureFile()
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(items, null, 2))
  } catch (e) {
    console.warn('Could not write payments to file system:', e)
    // Silently fail - in production, rely on database
  }
}

export async function createPayment(payload: {
  amount: number
  currency?: string
  method: string
  customer?: any
  meta?: any
}) {
  const now = new Date().toISOString()
  const rec: PaymentRecord = {
    id: randomUUID(),
    amount: payload.amount,
    currency: payload.currency || 'BRL',
    method: payload.method,
    customer: payload.customer || {},
    status: 'PENDING',
    meta: payload.meta || {},
    createdAt: now,
    updatedAt: now,
  }

  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const insert = dbmod.dbPrepare(`INSERT INTO payments (id, externalId, amount, currency, method, customer, status, meta, createdAt, updatedAt) VALUES (@id,@externalId,@amount,@currency,@method,@customer,@status,@meta,@createdAt,@updatedAt)`)
    insert.run({
      id: rec.id,
      externalId: null,
      amount: rec.amount,
      currency: rec.currency,
      method: rec.method,
      customer: JSON.stringify(rec.customer || {}),
      status: rec.status,
      meta: JSON.stringify(rec.meta || {}),
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    })
    return rec
  }

  const all = await readAll()
  all.push(rec)
  await writeAll(all)
  return rec
}

export async function updatePayment(id: string, patch: Partial<PaymentRecord>) {
  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const existing = await findPayment(id)
    if (!existing) return null
    const now = new Date().toISOString()
    const merged = { ...existing, ...patch, updatedAt: now }
    const update = dbmod.dbPrepare(`UPDATE payments SET externalId=@externalId, amount=@amount, currency=@currency, method=@method, customer=@customer, status=@status, meta=@meta, createdAt=@createdAt, updatedAt=@updatedAt WHERE id=@id`)
    update.run({
      id: merged.id,
      externalId: merged.externalId || null,
      amount: merged.amount,
      currency: merged.currency,
      method: merged.method,
      customer: JSON.stringify(merged.customer || {}),
      status: merged.status,
      meta: JSON.stringify(merged.meta || {}),
      createdAt: merged.createdAt,
      updatedAt: merged.updatedAt,
    })
    return merged
  }

  const all = await readAll()
  const idx = all.findIndex((p: any) => p.id === id || p.externalId === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  all[idx] = { ...all[idx], ...patch, updatedAt: now }
  await writeAll(all)
  return all[idx]
}

export async function findPayment(id: string) {
  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const stmt = dbmod.dbPrepare('SELECT * FROM payments WHERE id = @id OR externalId = @id LIMIT 1')
    const row = stmt.get({ id })
    if (!row) return null
    return {
      ...row,
      amount: Number(row.amount),
      customer: row.customer ? JSON.parse(row.customer) : {},
      meta: row.meta ? JSON.parse(row.meta) : {},
    }
  }
  const all = await readAll()
  return all.find((p) => p.id === id || p.externalId === id) || null
}

export async function findPaymentByExternal(externalId: string) {
  const dbmod = await loadDb()
  if (dbmod.isDbAvailable()) {
    const stmt = dbmod.dbPrepare('SELECT * FROM payments WHERE externalId = @externalId LIMIT 1')
    const row = stmt.get({ externalId })
    if (!row) return null
    return {
      ...row,
      amount: Number(row.amount),
      customer: row.customer ? JSON.parse(row.customer) : {},
      meta: row.meta ? JSON.parse(row.meta) : {},
    }
  }
  const all = await readAll()
  return all.find((p) => p.externalId === externalId) || null
}
