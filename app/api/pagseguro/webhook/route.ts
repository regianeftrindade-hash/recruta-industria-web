import { NextRequest } from 'next/server'
import fs from 'fs'
import { join } from 'path'

const DATA_DIR = join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'payments.json')

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { chargeId, externalId, status } = body

    if (!chargeId && !externalId) {
      return new Response(JSON.stringify({ error: 'chargeId or externalId required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const id = chargeId || externalId
    const all = await readAll()
    const idx = all.findIndex((p: any) => p.id === id || p.externalId === id)
    if (idx === -1) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    all[idx].status = (status || 'PAID').toUpperCase()
    all[idx].updatedAt = new Date().toISOString()
    await writeAll(all)

    return new Response(JSON.stringify({ ok: true, id: all[idx].id, status: all[idx].status }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
