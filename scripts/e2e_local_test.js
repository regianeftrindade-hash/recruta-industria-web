const http = require('http')
const ports = [3000, 3001, 3002]

function requestJSON(method, url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url)
    const opts = { method, hostname: u.hostname, port: u.port, path: u.pathname + u.search, headers: {} }
    const data = body ? JSON.stringify(body) : null
    if (data) opts.headers['Content-Type'] = 'application/json'
    const req = http.request(opts, (res) => {
      let buf = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (buf += c))
      res.on('end', () => {
        try {
          const parsed = buf ? JSON.parse(buf) : null
          resolve({ status: res.statusCode || 0, body: parsed })
        } catch (e) {
          resolve({ status: res.statusCode || 0, body: buf })
        }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

async function tryPort(port) {
  const base = `http://localhost:${port}`
  try {
    const create = await requestJSON('POST', base + '/api/pagseguro/create-payment', { amount: 1990, method: 'pix', customer: { name: 'E2E Test', email: 'e2e@test' } })
    if (!create || create.status >= 400) return null
    const data = create.body
    const id = data && (data.chargeId || data.id)
    if (!id) return { port, created: false }

    const statusBefore = (await requestJSON('GET', base + `/api/pagseguro/status?chargeId=${id}`)).body

    const wh = await requestJSON('POST', base + '/api/pagseguro/webhook', { chargeId: id, status: 'PAID' })
    const whRes = wh.body

    const statusAfter = (await requestJSON('GET', base + `/api/pagseguro/status?chargeId=${id}`)).body

    return { port, created: true, id, statusBefore, whRes, statusAfter }
  } catch (e) {
    return null
  }
}

(async () => {
  for (const p of ports) {
    process.stdout.write(`Trying port ${p}... `)
    await new Promise((r) => setTimeout(r, 200))
    const r = await tryPort(p)
    if (r) {
      console.log('OK', JSON.stringify(r, null, 2))
      process.exit(0)
    } else {
      console.log('no response')
    }
  }
  console.error('No server responded on ports', ports)
  process.exit(2)
})()
