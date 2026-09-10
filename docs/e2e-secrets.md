# Secrets E2E (Playwright) no GitHub

Os jobs **E2E empresa logada** e **E2E profissional logado** no CI são **opcionais**: só rodam se os secrets existirem. Sem eles, o CI continua verde (smoke público + unitários + build).

**Nunca** coloque e-mail/senha reais no repositório, em PRs ou em logs.

## Secrets no GitHub

Repositório → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret | Uso |
|--------|-----|
| `E2E_COMPANY_EMAIL` | E-mail da conta **empresa** de teste (produção ou staging estável) |
| `E2E_COMPANY_PASSWORD` | Senha dessa conta empresa |
| `E2E_PROFESSIONAL_EMAIL` | E-mail da conta **profissional** de teste |
| `E2E_PROFESSIONAL_PASSWORD` | Senha dessa conta profissional |

- Empresa e profissional são independentes: pode configurar só um par.
- Use contas dedicadas de teste (não a conta pessoal do admin).
- A URL alvo do CI é `https://www.recrutaindustria.com` (`E2E_BASE_URL` no workflow).

## Local

No `.env.local` (ou no shell), as mesmas variáveis — ver `.env.example`:

```bash
E2E_BASE_URL=https://www.recrutaindustria.com
E2E_COMPANY_EMAIL=...
E2E_COMPANY_PASSWORD=...
E2E_PROFESSIONAL_EMAIL=...
E2E_PROFESSIONAL_PASSWORD=...
```

Scripts:

- `npm run test:e2e:smoke` — público (sem login)
- `npm run test:e2e:empresa` — exige `E2E_COMPANY_*`
- `npm run test:e2e:profissional` — exige `E2E_PROFESSIONAL_*`

Sem credenciais, os specs logados fazem **skip** (não falham).

## Observabilidade (Sentry) — produção

Não é secret do GitHub Actions. Na **Vercel → Settings → Environment Variables** (Production):

| Variável | Valor |
|----------|------|
| `SENTRY_DSN` | DSN do projeto em [sentry.io](https://sentry.io) (Client Keys) |
| `NEXT_PUBLIC_SENTRY_DSN` | **Mesmo** DSN (browser) |

Opcionais (sourcemaps no build): `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Sem DSN o app sobe normalmente e só loga erros no console.

## Schema sem DDL no request (produção)

Depois de confirmar que `prisma migrate deploy` rodou ok no deploy:

| Variável | Valor |
|----------|------|
| `DISABLE_RUNTIME_DDL` | `true` |

Isso corta `CREATE TABLE`/`ALTER` no caminho da requisição e sobe a nota de arquitetura. Se alguma tabela antiga faltar, tire a variável e rode o migrate de novo.
