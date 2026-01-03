PagBank integration - local setup and testing

Overview
- Endpoints added under `/app/api/pagbank/`:
  - `create-payment` (POST) - create payment for `pix`, `boleto` or `card`. Persists locally in `data/payments.json`. If `PAGBANK_TOKEN` is configured, will attempt to call external API.
  - `status` (GET) - check status by `chargeId` (looks up local store first)
  - `webhook` (POST) - receives webhooks; verifies HMAC-SHA256 using `PAGBANK_WEBHOOK_SECRET` header `x-pagbank-signature` if secret present
  - `card-session` (POST) - simulated card checkout session (returns `checkoutUrl`)

Environment
- Copy `.env.example` to `.env.local` and fill:
  - `PAGBANK_API_URL` (optional)
  - `PAGBANK_TOKEN` (your pagbank API token) - when present, server will call external API
  - `PAGBANK_WEBHOOK_SECRET` (secret used to validate webhooks)

Local testing (no real credentials)
1. Start dev server:

```bash
npm run dev
```

2. Create a payment (pix):

```bash
curl -X POST http://localhost:3000/api/pagbank/create-payment \
  -H "Content-Type: application/json" \
  -d '{"amount":2990,"method":"pix","customer":{"name":"Teste","email":"a@b.com"}}'
```

3. Check status:

```bash
curl "http://localhost:3000/api/pagbank/status?chargeId=<chargeId>"
```

Testing webhooks with ngrok
1. Install/run ngrok and expose port 3000:

```bash
npx ngrok http 3000
```

2. In PagBank dashboard, configure webhook URL to:

```
https://<your-ngrok-subdomain>.ngrok.io/api/pagbank/webhook
```

3. PagBank will send POSTs to that URL; the webhook endpoint will validate signature if `PAGBANK_WEBHOOK_SECRET` is set.

Notes & next steps
- For production integrate official PagBank SDK or REST payloads (adjust `create-payment` mapping). Do NOT send raw card data to your server unless compliant with PCI.
- Rotate any exposed tokens immediately and remove them from repository history.
- Persist payment/subscribe data into a real DB (Postgres/Mongo) instead of the local `data/payments.json`.
- If you want, provide credentials and I can run an end-to-end test from here.
