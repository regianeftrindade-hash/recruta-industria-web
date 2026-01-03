const http = require('http')
const fs = require('fs')
const baseHost = 'localhost'
const basePort = 3000

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const opts = {
      hostname: baseHost,
      port: basePort,
      path,
      method,
      headers: {}
    }
    if (data) opts.headers['Content-Type'] = 'application/json'

    const req = http.request(opts, (res) => {
      let buf = ''
      res.setEncoding('utf8')
      res.on('data', (c) => (buf += c))
      res.on('end', () => {
        try {
          const parsed = buf ? JSON.parse(buf) : null
          resolve(parsed)
        } catch (e) {
          resolve(buf)
        }
      })
    })
    req.on('error', (err) => reject(err))
    if (data) req.write(data)
    req.end()
  })
}

;(async () => {
  try {
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    const create = await request('POST', '/api/pagseguro/create-payment', { amount: 1990, method: 'pix', customer: { name: 'E2E Node', email: 'e2e@node' } })
    fs.writeFileSync('./tmp/create_resp.json', JSON.stringify(create, null, 2))
    const id = create?.chargeId || create?.id
    if (!id) throw new Error('no id from create')
    const statusBefore = await request('GET', `/api/pagseguro/status?chargeId=${id}`)
    fs.writeFileSync('./tmp/status_before.json', JSON.stringify(statusBefore, null, 2))
    await request('POST', '/api/pagseguro/webhook', { chargeId: id, status: 'PAID' })
    await new Promise(r => setTimeout(r, 800))
    const statusAfter = await request('GET', `/api/pagseguro/status?chargeId=${id}`)
    fs.writeFileSync('./tmp/status_after.json', JSON.stringify(statusAfter, null, 2))
    console.log('E2E_OK', id)
  } catch (err) {
    fs.writeFileSync('./tmp/e2e_error.txt', String(err.stack || err))
    console.error('E2E_ERROR', err.message)
    process.exit(2)
  }
})()
