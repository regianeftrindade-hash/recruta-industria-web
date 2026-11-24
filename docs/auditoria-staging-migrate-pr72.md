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

## 9. Veredito

| Item | Estado |
|------|--------|
| Migrate staging | **Interrompido — não executado** |
| Migrate produção | **Não executado** (proibido) |
| Merge / deploy Production | **Não feito** |
| Preview parece ≠ produção (vagas) | Sim (500 vs 1096) |
| Prova de ref staging neste agente | **Insuficiente para autorizar migrate** |

*Nenhuma migration foi aplicada. Nenhum registro de produção foi modificado. Nenhum secret foi impresso.*

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
