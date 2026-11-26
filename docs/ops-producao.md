# Ops de produção — Recruta Indústria

Runbook curto para Vercel + banco + Sentry. Ordem importa.

Os testes Vitest não usam o banco deste runbook. Gravação de teste exige PostgreSQL local isolado: [banco-de-testes.md](./banco-de-testes.md). Não rode `npm test` com `DATABASE_URL` de produção no lugar de `TEST_DATABASE_URL`.

## 1. Schema no banco (obrigatório antes do DDL desligado)

No ambiente com `DATABASE_URL` / `DIRECT_URL` de **produção**:

```bash
npm run db:migrate
```

Equivale a `prisma migrate deploy`. Confirme que terminou sem erro.

Se alguma feature sumir depois (chat, ratings, etc.), o migrate pode estar incompleto — rode de novo e só então volte à etapa 2.

## 2. Cortar DDL no request path

Na **Vercel → Settings → Environment Variables** (Production):

| Variável | Valor |
|----------|--------|
| `DISABLE_RUNTIME_DDL` | `true` |

Efeito: o app deixa de fazer `CREATE`/`ALTER` no caminho da requisição (`lib/infra/ensure-db-schema.ts` e ensures locais).

Rollback: remova a variável (ou `false`), redeploy, rode o migrate de novo.

## 3. Rate-limit distribuído (Upstash — recomendado, não obrigatório)

Sem Redis o app **continua protegido** com limite em memória por instância (não é fail-open). Em Production com várias réplicas Vercel, o limite fica por máquina — por isso o Upstash é recomendado.

Na **Vercel → Environment Variables** (Production), após criar o database Redis no [Upstash](https://upstash.com):

| Variável | Valor |
|----------|--------|
| `UPSTASH_REDIS_REST_URL` | URL REST do Redis |
| `UPSTASH_REDIS_REST_TOKEN` | Token REST |

Validação: com as duas vars, o backend efetivo é Upstash; se a API falhar, há fallback automático para memória (ainda limitado).  
Checklist LGPD de DPA do Upstash: ver `docs/lgpd-pendencias-operacionais.md`.

## 4. Sentry

1. Abra [sentry.io](https://sentry.io) → projeto do Recruta → **Client Keys (DSN)**.
2. Na Vercel Production, defina:

| Variável | Valor |
|----------|--------|
| `SENTRY_DSN` | DSN completo |
| `NEXT_PUBLIC_SENTRY_DSN` | **o mesmo** DSN |

Sem DSN o site sobe normalmente; erros só vão para o console.  
O SDK usa `sendDefaultPii: false` e `beforeSend` com scrubbing de e-mail/tokens/chaves (não envia senhas/documentos de propósito).

Upgrade para `@sentry/nextjs` 11.x (advisory moderate da cadeia glob): **adiado** — breaking no plugin de build; planejar janela própria.

Opcional (sourcemaps no build): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Validação: abra o site, force um erro ou use o painel Sentry → Issues após um deploy com DSN.

## 5. E2E / CI

Secrets no GitHub e jobs logados: ver [e2e-secrets.md](./e2e-secrets.md).

Com secrets válidos, falha de login **deixa o CI vermelho** (jobs obrigatórios).  
Lint (`npm run lint`) é job obrigatório no workflow CI.

## Checklist rápido

1. [ ] `npm run db:migrate` ok no DB de produção  
2. [ ] `DISABLE_RUNTIME_DDL=true` na Vercel Production  
3. [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` na Vercel Production  
4. [ ] (Recomendado) `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`  
5. [ ] Actions: lint + testes + E2E empresa/profissional verdes  
6. [ ] Evento de teste visível no Sentry (se DSN configurado)  
7. [ ] `/manifest.webmanifest` HTTP 200  
8. [ ] Pendências LGPD (DPAs, CNPJ/endereço; DPO com dispensa ME) em `docs/lgpd-pendencias-operacionais.md` / `docs/lgpd-dispensa-encarregado-anpd-2-2022.md`  
