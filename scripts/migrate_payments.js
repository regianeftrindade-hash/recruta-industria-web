// Migration script: reads data/payments.json and inserts into SQLite (better-sqlite3)
const fs = require('fs')
const path = require('path')
try {
  const dynamicRequire = new Function('pkg', 'try{ return require(pkg) }catch(e){ return null }')
  const Database = dynamicRequire(['better', 'sqlite3'].join('-'))
  const dbPath = path.join(process.cwd(), 'data', 'payments.sqlite')
  const db = new Database(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      externalId TEXT,
      amount INTEGER,
      currency TEXT,
      method TEXT,
      customer TEXT,
      status TEXT,
      meta TEXT,
      createdAt TEXT,
      updatedAt TEXT
    )
  `)

  const file = path.join(process.cwd(), 'data', 'payments.json')
  if (!fs.existsSync(file)) {
    console.error('No data/payments.json found; nothing to migrate.')
    process.exit(1)
  }
  const items = JSON.parse(fs.readFileSync(file, 'utf8') || '[]')
  const insert = db.prepare(`INSERT OR REPLACE INTO payments (id, externalId, amount, currency, method, customer, status, meta, createdAt, updatedAt) VALUES (@id,@externalId,@amount,@currency,@method,@customer,@status,@meta,@createdAt,@updatedAt)`)
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run({
        id: r.id,
        externalId: r.externalId || null,
        amount: r.amount,
        currency: r.currency || 'BRL',
        method: r.method,
        customer: JSON.stringify(r.customer || {}),
        status: r.status,
        meta: JSON.stringify(r.meta || {}),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })
    }
  })
  tx(items)
  console.log('Migrated', items.length, 'payments to', dbPath)
} catch (err) {
  console.error('Migration failed — ensure better-sqlite3 is installed:', err.message)
  process.exit(1)
}
