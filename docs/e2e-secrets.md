# Secrets E2E (Playwright) no GitHub

Os jobs **E2E empresa logada** e **E2E profissional logado** no CI **sempre entram na fila**. Sem secrets, o Playwright faz **skip** (CI verde). Com secrets, os testes logados rodam de verdade.

**Importante:** não use `if: secrets.*` no workflow — o GitHub rejeita o arquivo e o CI fica vermelho sem rodar nada.

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

### Contas de teste (senha dos secrets)

Os secrets precisam ser de contas que entram com **e-mail + senha** no site (não só “Entrar com Google”).

1. Abra https://www.recrutaindustria.com/login?tipo=empresa  
2. Confirme que o e-mail/senha **de teste** entram no painel  
3. Faça o mesmo com a conta profissional: `/login?tipo=profissional`  
4. Se só entra com Google: use **Esqueci a senha**, defina uma senha, depois atualize o secret  
5. Secrets: https://github.com/regianeftrindade-hash/recruta-industria-web/settings/secrets/actions  

Atualize pelo menos:
- `E2E_COMPANY_PASSWORD`
- `E2E_PROFESSIONAL_PASSWORD`

### Se o e2e logado falhar no login

Com secrets definidos, login inválido **falha** o job e2e e o **CI fica vermelho**. Corrija e-mail/senha dos secrets e rode de novo.

Causas comuns:

1. Senha errada no secret (atualize `E2E_*_PASSWORD`)
2. Conta só existe com Google (sem senha) — crie senha em “esqueci a senha” ou use conta com e-mail+senha
3. Typo no **nome** do secret (`E2E_COMPANY_EMAIL`, sem L a mais)

Scripts:

- `npm run test:e2e:smoke` — público (home → login → cadastro, sem login)
- `npm run test:e2e:empresa` — exige `E2E_COMPANY_*` (funil + perfil da vitrine)
- `npm run test:e2e:profissional` — exige `E2E_PROFESSIONAL_*`

Sem credenciais, os specs logados fazem **skip** (não falham).

### Checklist rápido (nota 9+)

1. Criar os 4 secrets no GitHub (tabela acima).
2. Confirmar no Actions que os jobs **E2E empresa/profissional logada** rodaram (não “Skipped”).
3. Manter `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` na Vercel Production.
4. Manter `DISABLE_RUNTIME_DDL=true` só se o schema já estiver migrado.

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
