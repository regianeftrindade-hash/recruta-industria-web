const fs = require('fs')
const path = require('path')

async function main() {
  const dynamicRequire = new Function('pkg', 'try{ return require(pkg) }catch(e){ return null }')
  const dynamicResolve = new Function('p', 'try{ return require.resolve(p) }catch(e){ return null }')
  const initSqlJs = dynamicRequire('sql.js')
  const SQL = await initSqlJs({
    locateFile: (file) => {
      const candidate = 'sql.js/dist/' + file
      const resolved = dynamicResolve(candidate)
      if (resolved) return resolved
      return path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
    },
  })

  const dataFile = path.resolve(__dirname, '..', 'data', 'payments.json')
  if (!fs.existsSync(dataFile)) {
    console.error('payments.json not found at', dataFile)
    process.exit(1)
  }

  const items = JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]')

  const db = new SQL.Database()
  db.run(`
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
    );
  `)

  const insert = db.prepare(`INSERT OR REPLACE INTO payments (id, externalId, amount, currency, method, customer, status, meta, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`)

  for (const it of items) {
    insert.run([
      it.id,
      it.externalId || null,
      it.amount,
      it.currency || 'BRL',
      it.method,
      JSON.stringify(it.customer || {}),
      it.status,
      JSON.stringify(it.meta || {}),
      it.createdAt,
      it.updatedAt,
    ])
  }
  insert.free()

  const outPath = path.resolve(__dirname, '..', 'data', 'payments.sqlite')
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, Buffer.from(db.export()))
  console.log('Wrote', outPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
