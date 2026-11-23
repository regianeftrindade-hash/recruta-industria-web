# Secrets E2E (Playwright) no GitHub

Os jobs **E2E empresa logada** e **E2E profissional logado** no CI **sempre entram na fila**. Sem secrets, o Playwright faz **skip** (CI verde). Com secrets, os testes logados rodam de verdade.

Estes testes de navegador falam com o site. Eles não gravam pelo Prisma. Os testes Vitest que gravam vaga e candidatura usam outro banco, local e isolado: [banco-de-testes.md](./banco-de-testes.md). Não aponte `TEST_DATABASE_URL` para produção.

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
- **Smoke público** no CI: build local do commit (`E2E_BASE_URL=http://127.0.0.1:3000`) — não usa produção.
- **Empresa/profissional logados** no CI: `https://www.recrutaindustria.com` (contas dos secrets).

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

1. Abra a home https://www.recrutaindustria.com/ (login empresa no topo)  
2. Confirme que o e-mail/senha **de teste** entram no painel  
3. Faça o mesmo com a conta profissional (formulário de login na home)  
4. Se só entra com Google: use **Esqueci a senha**, defina uma senha, depois atualize o secret  
5. Secrets: https://github.com/regianeftrindade-hash/recruta-industria-web/settings/secrets/actions  

Atualize pelo menos:
- `E2E_COMPANY_PASSWORD`
- `E2E_PROFESSIONAL_PASSWORD`

### Se o e2e logado falhar no login

Com secrets definidos, login inválido **falha** o job e2e e o **CI fica vermelho**. Corrija e-mail/senha dos secrets e rode de novo.

Resposta típica do NextAuth (já observada em produção):

- HTTP **401**
- JSON `{ "url": ".../api/auth/error?error=CredentialsSignin&provider=credentials" }` (sem campo `error` no corpo)

Isso é **CredentialsSignin**: `authorize` recusou e-mail/senha (conta inexistente, sem `passwordHash`, ou senha divergente do secret). Não é schema drift (P2022).

Causas comuns:

1. Senha errada no secret (atualize `E2E_*_PASSWORD`)
2. Conta só existe com Google (sem senha) — crie senha em “esqueci a senha” ou use conta com e-mail+senha
3. Typo no **nome** do secret (`E2E_COMPANY_EMAIL`, sem L a mais)
4. Aspas extras no valor do secret (`"senha"`); o helper E2E já tenta remover aspas externas

Scripts:

- `npm run test:e2e:smoke` — público (home → login → cadastro, sem login)
- `npm run test:e2e:empresa` — exige `E2E_COMPANY_*` (funil + perfil da vitrine)
- `npm run test:e2e:profissional` — exige `E2E_PROFESSIONAL_*`

Sem credenciais, os specs logados fazem **skip** (não falham).

### Checklist rápido (nota 9+)

1. Criar os 4 secrets no GitHub (tabela acima).
2. Confirmar no Actions que os jobs **E2E empresa/profissional logada** rodaram de verdade (não “Skipped”) e ficaram **verdes** — com secrets inválidos o CI fica **vermelho**.
3. Ops Vercel (Sentry + migrate/DDL): seguir o runbook em [ops-producao.md](./ops-producao.md).

## Observabilidade e schema (produção)

Detalhes e ordem correta (migrate → `DISABLE_RUNTIME_DDL` → Sentry): **[ops-producao.md](./ops-producao.md)**.

Resumo:

| Variável (Vercel Production) | Quando |
|------------------------------|--------|
| `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` | Sempre (mesmo DSN) |
| `DISABLE_RUNTIME_DDL=true` | Só depois de `prisma migrate deploy` ok |
