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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const chargeId = url.searchParams.get('chargeId')
    if (!chargeId) {
      return new Response(JSON.stringify({ error: 'chargeId is required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const all = await readAll()
    const rec = all.find((p: any) => p.id === chargeId || p.externalId === chargeId) || null

    if (!rec) {
      return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ id: rec.id, status: rec.status, amount: rec.amount, method: rec.method, meta: rec.meta }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'unexpected' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
