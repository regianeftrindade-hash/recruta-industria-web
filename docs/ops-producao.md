# Ops de produção — Recruta Indústria

Runbook curto para Vercel + banco + Sentry. Ordem importa.

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

## 3. Sentry

1. Abra [sentry.io](https://sentry.io) → projeto do Recruta → **Client Keys (DSN)**.
2. Na Vercel Production, defina:

| Variável | Valor |
|----------|--------|
| `SENTRY_DSN` | DSN completo |
| `NEXT_PUBLIC_SENTRY_DSN` | **o mesmo** DSN |

Sem DSN o site sobe normalmente; erros só vão para o console.

Opcional (sourcemaps no build): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Validação: abra o site, force um erro ou use o painel Sentry → Issues após um deploy com DSN.

## 4. E2E / CI

Secrets no GitHub e jobs logados: ver [e2e-secrets.md](./e2e-secrets.md).

Com secrets válidos, falha de login **deixa o CI vermelho** (jobs obrigatórios).

## Checklist rápido

1. [ ] `npm run db:migrate` ok no DB de produção  
2. [ ] `DISABLE_RUNTIME_DDL=true` na Vercel Production  
3. [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` na Vercel Production  
4. [ ] Actions: E2E empresa + profissional verdes  
5. [ ] Evento de teste visível no Sentry (se DSN configurado)  
