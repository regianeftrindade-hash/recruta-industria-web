#!/usr/bin/env node
/**
 * Validação READ-ONLY do cutover Stripe LIVE (não altera nada, não cobra).
 *
 * Uso (com sk_live e Price IDs no ambiente):
 *   node scripts/validate-stripe-live-cutover.mjs
 *
 * Critérios dos 6 planos empresa:
 *   BASIC        monthly  USD 49.00  (4900)
 *   BASIC        yearly   USD 490.00 (49000)
 *   PREMIUM      monthly  USD 99.00  (9900)
 *   PREMIUM      yearly   USD 990.00 (99000)
 *   EMPRESARIAL  monthly  USD 199.00 (19900)
 *   EMPRESARIAL  yearly   USD 1990.00 (199000)
 */
const EXPECTED = [
  ["STRIPE_PRICE_COMPANY_BASIC_MONTHLY", 4900, "month", "BASIC"],
  ["STRIPE_PRICE_COMPANY_BASIC_YEARLY", 49000, "year", "BASIC"],
  ["STRIPE_PRICE_COMPANY_PREMIUM_MONTHLY", 9900, "month", "PREMIUM"],
  ["STRIPE_PRICE_COMPANY_PREMIUM_YEARLY", 99000, "year", "PREMIUM"],
  ["STRIPE_PRICE_COMPANY_EMPRESARIAL_MONTHLY", 19900, "month", "EMPRESARIAL"],
  ["STRIPE_PRICE_COMPANY_EMPRESARIAL_YEARLY", 199000, "year", "EMPRESARIAL"],
];

function fail(msg) {
  console.error(`FAIL\t${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`PASS\t${msg}`);
}

async function stripeGet(secret, path) {
  const auth = Buffer.from(`${secret}:`).toString("base64");
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const body = await res.json();
  return { status: res.status, body };
}

async function main() {
  const secret = (process.env.STRIPE_SECRET_KEY || "").trim();
  if (!secret.startsWith("sk_live_")) {
    fail("STRIPE_SECRET_KEY precisa ser sk_live_ para validar LIVE (não execute cutover com sk_test_).");
    return;
  }
  ok("STRIPE_SECRET_KEY em modo LIVE");

  const pub = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim();
  if (pub && !pub.startsWith("pk_live_")) {
    fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não é pk_live_");
  } else if (pub) {
    ok("Publishable key LIVE");
  } else {
    fail("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ausente");
  }

  const whsec = (process.env.STRIPE_WEBHOOK_SECRET || "").trim();
  if (!whsec.startsWith("whsec_")) {
    fail("STRIPE_WEBHOOK_SECRET ausente ou inválido");
  } else {
    ok("STRIPE_WEBHOOK_SECRET presente");
  }

  if ((process.env.PROFESSIONAL_PREMIUM_ENABLED || "").trim().toLowerCase() === "true") {
    fail("PROFESSIONAL_PREMIUM_ENABLED=true — deve permanecer oculto no cutover");
  } else {
    ok("Premium profissional não habilitado");
  }

  for (const [envName, amount, interval, tier] of EXPECTED) {
    const priceId = (process.env[envName] || "").trim();
    if (!priceId.startsWith("price_")) {
      fail(`${envName} ausente`);
      continue;
    }
    const { status, body } = await stripeGet(secret, `/prices/${priceId}`);
    if (status !== 200) {
      fail(`${envName} (${priceId}): Stripe HTTP ${status} ${body?.error?.message || ""}`);
      continue;
    }
    if (body.livemode !== true) {
      fail(`${envName}: preço não está em livemode`);
      continue;
    }
    const gotInterval = body.recurring?.interval;
    const gotAmount = body.unit_amount;
    const currency = body.currency;
    if (currency !== "usd" || gotAmount !== amount || gotInterval !== interval) {
      fail(
        `${envName}: esperado ${tier} ${interval} ${amount} usd; obtido ${gotInterval} ${gotAmount} ${currency}`,
      );
      continue;
    }
    ok(`${envName}: ${tier} ${interval} ${amount} usd (livemode)`);
  }

  // Asaas não é alterado pelo cutover Stripe — só checagem de presença.
  if (!(process.env.ASAAS_API_KEY || "").trim()) {
    fail("ASAAS_API_KEY ausente (BR deve continuar no Asaas)");
  } else {
    ok("ASAAS_API_KEY presente (BR)");
  }

  if (process.exitCode) {
    console.error("\nCutover NÃO pronto — corrija os FAIL acima (sem alterar preços LIVE).");
  } else {
    console.log("\nCutover LIVE validado (read-only). Pronto para autorização de publicação.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
