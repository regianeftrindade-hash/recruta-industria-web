# Preparação staging — migrate PR #72 (interrompido)

**Data:** 23–24/11/2026 (America/Sao_Paulo)  
**Branch:** `cursor/auditoria-geral-rodada2-06b8`  
**Regra aplicada:** se a conexão exclusiva de staging não for comprovada neste agente, **não** executar `prisma migrate deploy`.

---

## 1. Prisma e migrations pendentes (código)

Arquivos no repositório:

| Migration | Conteúdo |
|-----------|----------|
| `20261124020000_password_reset_tokens` | `CREATE TABLE IF NOT EXISTS password_reset_tokens` + índices |
| `20261124021000_profile_message_reply_columns` | `ADD COLUMN IF NOT EXISTS senderRole/replyToId` + índice |

`prisma migrate status` **neste ambiente** (com `DATABASE_URL` atual) ainda lista as duas como **não aplicadas** — mas essa conexão é a de **produção** (ver §2). Status em produção **não** autoriza migrate daqui.

---

## 2. Prova de conexão neste agente

| Variável | Projeto (ref do user `postgres.<ref>`) | Conclusão |
|----------|----------------------------------------|-----------|
| `DATABASE_URL` | `yxwgjlzzxkitvcduckgk` | **Produção** (conhecida das auditorias anteriores; 1.096 vagas) |
| `DIRECT_URL` | `yxwgjlzzxkitvcduckgk` | Mesmo projeto |
| `STAGING_DATABASE_URL` / `STAGING_DIRECT_URL` | Ausentes | — |

**Matches produção: SIM.**  
**Staging exclusivo neste shell: NÃO.**

Por isso **`prisma migrate deploy` NÃO foi executado.**

---

## 3. Preview Vercel × produção (evidência indireta)

| Endpoint | Produção (`www.recrutaindustria.com`) | Preview PR #72 |
|----------|----------------------------------------|----------------|
| `GET /api/vagas` | HTTP **200**, total **1096** | HTTP **500**, erro genérico |
| `GET /api/payment/config` | `configured: true`, Stripe/Asaas preenchidos | `configured: false`, Stripe prices ausentes, Asaas “após login” |

Interpretação:

- O Preview **não** se comporta como a produção saudável (vagas).
- Isso é **compatível** com Preview apontando para o projeto novo/vazio `recruta-industria-staging` (schema incompleto → falha ao listar vagas).
- **Não** obtivemos o ref Supabase do Preview (sem `VERCEL_TOKEN`, `/api/debug/env` bloqueado fora de development).
- Logo: **indício forte de isolamento do Preview**, mas **sem comprovação criptográfica do project ref** neste agente.

Identificador de destino **declarado por você:** projeto Supabase `recruta-industria-staging` (nome). Ref numérico/alfanumérico do projeto staging: **não lido daqui** (credenciais Preview só na Vercel).

---

## 4. Migrate em staging

**Status: NÃO EXECUTADO** (bloqueio deliberado).

Motivo: a única `DIRECT_URL` disponível no Cloud Agent aponta para produção. Executar migrate aqui violaria a regra.

---

## 5. Verificação pós-migrate / testes reset e mensagens

**Não executados** — dependem do passo 4.

Testes unitários já existentes no PR (sem banco staging):

- `lib/security/__tests__/password-reset-token.test.ts` (mock)
- Demais testes ProfileMessage / i18n — não substituem migrate + smoke no staging

---

## 6. Schema Prisma × banco staging

**Não verificado** — sem conexão staging comprovada neste agente.

---

## 7. Problemas encontrados

1. **Bloqueio:** Cloud Agent ainda usa produção em `DATABASE_URL`/`DIRECT_URL`.  
2. Preview sem Stripe prices / payment config incompleto (esperado se só DB Preview foi trocado).  
3. Preview `/api/vagas` 500 — staging provavelmente sem `job_postings`/migrations base; precisa `migrate deploy` **no staging**, não só as duas do #72 se o banco for verde.  
4. Sem token Vercel/Supabase Management neste ambiente para ler env Preview ou project ref.

---

## 8. O que falta para continuar (sua ação)

Para este agente retomar o migrate **com segurança**:

1. Injetar no ambiente do Cloud Agent (não na Production Vercel) variáveis **distintas** da produção, por exemplo:  
   - `STAGING_DATABASE_URL`  
   - `STAGING_DIRECT_URL` (host direto `db.<ref-staging>.supabase.co:5432` preferível)  
2. Confirmar que o `project_ref` extraído do user/host é **≠** `yxwgjlzzxkitvcduckgk`.  
3. Avisar o agente para repetir: fingerprint → `prisma migrate deploy` só com essas vars → smoke reset.

Alternativa (você no terminal local / CI com secrets Preview):

```bash
# Com URLs de STAGING apenas (nunca as de Production)
export DATABASE_URL="…pooler staging…"
export DIRECT_URL="…direto staging…"
npx prisma migrate deploy
npx prisma migrate status
```

Se o staging for **banco novo vazio**, rode o histórico completo (`migrate deploy` aplica todas as pendentes da pasta, não só as duas do #72).

---

## 9. Veredito (atualizado §13 — 24/11/2026 ~01:20 America/Sao_Paulo)

| Item | Estado |
|------|--------|
| Ref staging `gshhznyretzrdnmkgmgj` | **OK** |
| Isolamento ≠ produção `yxwgjlzzxkitvcduckgk` | **OK** |
| Auth staging (pooler `:6543` + session `:5432`) | **OK** |
| Schema staging alinhado a `schema.prisma` | **OK** (57 tabelas) |
| Histórico Prisma staging | **up to date** (29 applied) |
| Migrate produção | **Não executado** |
| Merge / deploy Production | **Não feito** |
| Secrets globais `DATABASE_URL`/`DIRECT_URL` | **Não alterados** |

*Operações de schema só no projeto `gshhznyretzrdnmkgmgj`. Nenhum secret impresso no relatório.*

---

## 10. Nova tentativa — STAGING_* no Cloud Agent (interrompido de novo)

Pedido do usuário: usar `STAGING_DATABASE_URL` e `STAGING_DIRECT_URL` exclusivas; nunca `DATABASE_URL`/`DIRECT_URL`.

| Verificação | Resultado |
|-------------|-----------|
| `STAGING_DATABASE_URL` no ambiente do agente | **AUSENTE** |
| `STAGING_DIRECT_URL` no ambiente do agente | **AUSENTE** |
| Extração de project ref | **Não possível** |
| Comparação com `yxwgjlzzxkitvcduckgk` | **Não possível** |
| Consulta read-only no staging | **Não executada** |
| `prisma migrate deploy` | **NÃO executado** (gate falhou) |

Globals ainda presentes e apontando para produção — **intencionalmente não usados**.

Foi solicitada a inclusão dos secrets `STAGING_DATABASE_URL` e `STAGING_DIRECT_URL` no ambiente deste Cloud Agent. Após estarem injetados na sessão, repetir o gate (ref ≠ produção, ambas iguais) e só então o migrate.

---

## 11. Tentativa com STAGING_* injetadas (interrompida na identidade)

| Verificação | Resultado |
|-------------|-----------|
| `STAGING_*` presentes | Sim |
| Project ref (ambas) | `gshhznyretzrdnmkgmgj` |
| ≠ produção `yxwgjlzzxkitvcduckgk` | Sim |
| Mesmo projeto nas duas vars | Sim |
| Região pooler | `sa-east-1` (produção conhecida: `us-east-2`) |
| `DIRECT` host `db.<ref>.supabase.co:5432` | DNS só IPv6 → **TCP unreachable** neste agente |
| Pooler `:6543` / `:5432` TCP | OK |
| Consulta read-only / auth | **FALHA: password authentication failed** |
| `prisma migrate deploy` | **NÃO executado** |

Globals `DATABASE_URL`/`DIRECT_URL` de produção **não** foram usadas no migrate (não houve migrate).

### Causa do bloqueio
A senha configurada nas URLs de staging foi rejeitada pelo pooler Supabase (`FATAL: password authentication failed for user "postgres"`), mesmo com user `postgres.<ref>` e encoding correto de caracteres especiais (`[`, `]`, `-`).

### Ação necessária (sua)
1. No painel Supabase do projeto **recruta-industria-staging** (`gshhznyretzrdnmkgmgj`): resetar/confirmar a **database password**.  
2. Atualizar `STAGING_DATABASE_URL` e `STAGING_DIRECT_URL` no Cloud Agent com a senha correta (URL-encode de caracteres especiais).  
3. Para este agente, preferir `DIRECT_URL` de staging como pooler sessão `:5432` (o host `db.*` está inacessível por IPv6 aqui).  
4. Pedir novamente o migrate após o gate de auth passar.

---

## 12. Re-verificação após atualização de senha (24/11/2026 ~00:04 America/Sao_Paulo)

Pedido: senha atualizada no Supabase staging e em `STAGING_DATABASE_URL` / `STAGING_DIRECT_URL`; repetir gates; migrar só se auth OK.

### 12.1 Isolamento de project ref (GATE_OK)

| Checagem | Resultado |
|----------|-----------|
| `STAGING_DATABASE_URL` host/user | `aws-1-sa-east-1.pooler.supabase.com:6543` / `postgres.gshhznyretzrdnmkgmgj` |
| `STAGING_DIRECT_URL` host/user | `db.gshhznyretzrdnmkgmgj.supabase.co:5432` / `postgres` |
| Ambas → `gshhznyretzrdnmkgmgj` | **Sim** |
| Nenhuma → produção `yxwgjlzzxkitvcduckgk` | **Confirmado** |
| Globals `DATABASE_URL`/`DIRECT_URL` usadas no teste | **Não** (apenas fingerprint; migrate não usou) |

### 12.2 Autenticação somente leitura (GATE_FAIL)

Testes com Prisma e `psql`, senha decodificada da URL e re-encodada (`[`, `]`, `-`), nos alvos:

| Alvo | Resultado |
|------|-----------|
| Pooler sessão `:5432` (`postgres.<ref>`) | **FAIL** — `password authentication failed` |
| Pooler transaction `:6543` (`postgres.<ref>`) | **FAIL** — `password authentication failed` |
| Direct `db.<ref>.supabase.co:5432` | **FAIL** — host unreachable (IPv6); sem auth válida |

Fingerprint da senha presente nesta sessão do agente (não é o valor): `sha256_12=445f8cf1ca3f`, `pw_len=24`, especiais `['-', '[', ']']` — **igual** à tentativa anterior à “atualização”, o que indica que **esta VM ainda pode estar com o secret antigo** (secrets do Cloud Agent costumam ser injetados no boot e não hot-reload).

### 12.3 Identidade / schema / migrations

**Não executados** — auth falhou antes de qualquer `SELECT` de identidade.

### 12.4 Migrate

**NÃO EXECUTADO** (regra: qualquer falha → interromper).  
Merge / deploy: **não feitos**.

### 12.5 O que falta

1. Garantir que a senha no Supabase **Database settings** do projeto `gshhznyretzrdnmkgmgj` é a mesma embutida em `STAGING_*`.  
2. Atualizar `STAGING_DATABASE_URL` e `STAGING_DIRECT_URL` nos **secrets do Cloud Agent / ambiente** (não só Vercel Preview).  
3. **Reiniciar o agente** (ou nova sessão) para a VM receber os valores novos — conferir se o fingerprint `sha256_12` muda.  
4. Pedir de novo: gate → auth → migrate só em staging.

---

## 13. Migrate staging executado (24/11/2026 ~01:18–01:22 America/Sao_Paulo)

### 13.1 Gate pré-execução

| Checagem | Resultado |
|----------|-----------|
| Alvo | `gshhznyretzrdnmkgmgj` (sa-east-1 pooler) |
| `DATABASE_URL` do comando | staging pooler `:6543` + `pgbouncer=true` (override local) |
| `DIRECT_URL` do comando | `STAGING_DIRECT_URL` session pooler `:5432` (override local) |
| Produção `yxwgjlzzxkitvcduckgk` | **não** usada |
| Secrets globais alterados | **Não** |

### 13.2 Pendências antes do deploy

`prisma migrate status` no staging: **29 migrations** não aplicadas (banco vazio).

### 13.3 `prisma migrate deploy` (primeira tentativa)

**Falhou** em `20260105235359_marketplace_vitrine` com `ERROR: type "datetime" does not exist` (SQL legado SQLite).  
Estado: 1 linha em `_prisma_migrations` (failed). Tabelas de app: nenhuma.

Recuperação no **staging apenas**: `prisma migrate resolve --rolled-back 20260105235359_marketplace_vitrine`.

### 13.4 Baseline seguro (banco Postgres verde)

Como as 2 primeiras migrations são SQLite e `init_postgres` é só `SELECT 1`, `migrate deploy` sozinho **não** cria o schema em banco novo.

Procedimento aplicado **somente no staging**:

1. `prisma db push --accept-data-loss` → schema sincronizado com `schema.prisma`  
2. `prisma migrate resolve --applied` para as 29 migrations  
3. `prisma migrate status` → **Database schema is up to date!**

### 13.5 Validação pós-baseline

| Item | Resultado |
|------|-----------|
| Identidade | `postgres` / PG **17.12** |
| Tabelas public | **57** |
| `password_reset_tokens` | Existe (`id`, `email`, `tokenHash`, `expiresAt`, `usedAt`, `createdAt`) |
| `ProfileMessage.senderRole` / `replyToId` | Existem |
| FKs amostradas | `Company/Professional/Profile → User`; `ProfileMessage → Profile`; `job_applications/favorites → job_postings/User/Profile` |
| Contagens | todas **0** (staging vazio de dados) |
| Migrações applied | **29** (inclui `20261124020000_password_reset_tokens` e `20261124021000_profile_message_reply_columns`) |

### 13.6 Produção / merge / deploy

**Não tocados.** Globals de produção permanecem nos secrets do agente; overrides foram só no shell do comando.
