const http = require('http')
const fs = require('fs')

const envHost = process.env.HOST
const envPort = process.env.PORT ? Number(process.env.PORT) : undefined

const PREFERRED_PORTS = envPort ? [envPort] : [3000, 3001]
const HOSTS = envHost ? [envHost] : ['localhost', '127.0.0.1']

let baseHost = HOSTS[0]
let basePort = PREFERRED_PORTS[0]

function request(method, path, body, timeout = 5000) {
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
    req.setTimeout(timeout, () => {
      req.destroy(new Error('timeout'))
    })
    if (data) req.write(data)
    req.end()
  })
}

async function waitForServer(retries = 60) {
  for (let i = 0; i < retries; i++) {
    try {
      await request('GET', '/')
      return true
    } catch (e) {
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  return false
}

function ts() {
  return new Date().toISOString().replace(/[:.]/g, '-')
}

;(async () => {
  const stamp = ts()
  try {
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp')
    // connectivity log
    const connLog = []
    // try hosts/ports to find one that responds
    let found = false
    for (const h of HOSTS) {
      for (const p of PREFERRED_PORTS) {
        baseHost = h
        basePort = p
        connLog.push(`trying ${h}:${p}`)
        // quick TCP check
        const ok = await (async () => {
          return new Promise((res) => {
            const net = require('net')
            const s = new net.Socket()
            let done = false
            s.setTimeout(1000)
            s.once('error', () => { if (!done) { done = true; res(false) } })
            s.once('timeout', () => { if (!done) { done = true; s.destroy(); res(false) } })
            s.connect(p, h, () => { if (!done) { done = true; s.end(); res(true) } })
          })
        })()
        connLog.push(`${h}:${p} tcp=${ok}`)
        if (ok) {
          // try HTTP root
          try {
            await request('GET', '/')
            connLog.push(`${h}:${p} http=OK`)
            found = true
            break
          } catch (e) {
            connLog.push(`${h}:${p} http=ERR ${e.message}`)
          }
        }
      }
      if (found) break
    }
    fs.writeFileSync(`./tmp/connectivity_${ts()}.txt`, connLog.join('\n'))
    if (!found) throw new Error('server_not_ready')

    // Create with retries
    let create
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        create = await request('POST', '/api/pagseguro/create-payment', { amount: 1990, method: 'pix', customer: { name: 'E2E Runner', email: 'e2e@local' } }, 8000)
        break
      } catch (err) {
        if (attempt === 6) throw err
        await new Promise((r) => setTimeout(r, attempt * 1000))
      }
    }
    fs.writeFileSync(`./tmp/create_resp_${stamp}.json`, JSON.stringify(create, null, 2))

    const id = create?.chargeId || create?.id
    if (!id) throw new Error('no_id_from_create')

    const statusBefore = await request('GET', `/api/pagseguro/status?chargeId=${id}`)
    fs.writeFileSync(`./tmp/status_before_${stamp}.json`, JSON.stringify(statusBefore, null, 2))

    // Post webhook (simulate provider)
    let webhookResp
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        webhookResp = await request('POST', '/api/pagseguro/webhook', { chargeId: id, status: 'PAID' }, 5000)
        break
      } catch (err) {
        if (attempt === 4) throw err
        await new Promise((r) => setTimeout(r, attempt * 1000))
      }
    }
    fs.writeFileSync(`./tmp/webhook_resp_${stamp}.json`, JSON.stringify(webhookResp, null, 2))

    // Wait a bit for processing
    await new Promise((r) => setTimeout(r, 1000))

    const statusAfter = await request('GET', `/api/pagseguro/status?chargeId=${id}`)
    fs.writeFileSync(`./tmp/status_after_${stamp}.json`, JSON.stringify(statusAfter, null, 2))

    fs.writeFileSync(`./tmp/test_result_${stamp}.txt`, `OK ${id} - before:${statusBefore?.status} after:${statusAfter?.status || 'UNKNOWN'}`)
    console.log('E2E_OK', id)
    process.exit(0)
  } catch (err) {
    fs.writeFileSync(`./tmp/e2e_error_${stamp}.txt`, String(err.stack || err))
    console.error('E2E_ERROR', err && err.message)
    process.exit(2)
  }
})()
