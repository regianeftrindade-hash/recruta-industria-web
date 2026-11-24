# Auditoria final de integridade — Staging pós-baseline (PR #72)

**Data:** 24/11/2026 ~01:27–01:35 (America/Sao_Paulo)  
**Projeto:** Supabase staging `gshhznyretzrdnmkgmgj` (PG **17.12**, pooler sa-east-1)  
**Escopo:** somente staging. Produção `yxwgjlzzxkitvcduckgk` **não** acessada para escrita. Sem merge/deploy.  
**Secrets globais `DATABASE_URL` / `DIRECT_URL`:** não alterados (overrides só no comando).

---

## 1. Método

1. Gate: `STAGING_*` → `gshhznyretzrdnmkgmgj`; Session Pooler `:5432` como `DIRECT_URL` local.  
2. Extrair CREATE/ALTER/INDEX/FK/ENUM/FUNCTION/TRIGGER/POLICY/RLS/GRANT das **29** migrations.  
3. Inventariar schema live (`pg_catalog` / `information_schema`).  
4. `prisma migrate diff --from-url <staging> --to-schema-datamodel prisma/schema.prisma`.  
5. CRUD em tabelas principais + limpeza.  
6. Correção segura apenas no staging (higiene de `_prisma_migrations`).

---

## 2. Comparação migrations × schema real (`db push`) × `schema.prisma`

| Fonte | Tabelas |
|-------|---------|
| Migrations `CREATE TABLE` | 38 |
| Live `public` (excl. `_prisma_migrations`) | **56** |
| `schema.prisma` (`@@map` / model) | **56** |

- **Live ≡ Prisma:** sim (`migrate diff` → *empty migration*).  
- **Migrations CREATE ⊂ Live:** sim (0 tabelas da migration ausentes no live).  
- **18 tabelas só no Prisma/live** (nunca tiveram `CREATE` nas migrations; vieram do `db push` / schema atual):  
  `CompanyFavorite`, `CompanyProfileTracking`, `CompanySearchHistory`, `activity_logs`, `audit_logs`, `chat_rooms`, `company_views`, `favorite_candidates`, `favorite_jobs`, `interviews`, `messages`, `notifications`, `plan_permissions`, `plans`, `profile_views`, `ratings`, `reports`, `subscriptions`.

### 2.1 DDL de migration **não** materializado pelo `db push`

| Migration | Objeto | Motivo | Risco app |
|-----------|--------|--------|-----------|
| `20260908150000_profile_public_slug` | coluna `Profile.publicSlug` + índice único | **Não existe** em `schema.prisma` atual | Nenhum (app não modela o campo) |
| `20261022140000_job_application_phone` | coluna `job_postings.applicationPhone` | Supersedida por `applicationWhatsapp` no schema / migration seguinte | Nenhum |

**Decisão:** **não** criar essas colunas no staging. Adicioná-las geraria drift **contra** `schema.prisma` (fonte de verdade do Prisma Client). Equivalência “migration SQL 100%” ≠ equivalência “schema da aplicação”.

### 2.2 Índices com nome diferente (cobertura equivalente)

10 nomes de índice das migrations não existem no live, mas o `db push` criou índices Prisma cobrindo as mesmas colunas (ex.: `CompanyTeamMember_inviteToken_uidx` → `CompanyTeamMember_inviteToken_key`; `notification_deliveries_idempotency_key` → `…_idempotencyKey_key`; `JobProposalTracking_proposalId_idx` coberto por unique `…_proposalId_key`).

**Não corrigido** — equivalência funcional OK; renomear seria cosmético.

### 2.3 Foreign keys

- Live: **27** FKs.  
- Migrations (extract): 20 relações nomeadas; pares coluna→referência presentes no live para o núcleo User/Company/Profile/jobs/messages.  
- FKs extras no live vêm do schema Prisma (talent lists, proposals, plans, chat, etc.) — esperado após `db push`.

### 2.4 Enums, triggers, functions, RLS, grants

| Objeto | Nas migrations | No live staging |
|--------|----------------|-----------------|
| ENUM | 0 | 0 |
| FUNCTION (public) | 0 | 0 |
| TRIGGER (não interno) | 0 | 0 |
| POLICY / RLS enable | 0 | 0 tabelas com RLS |
| GRANTs especiais (não-postgres) | 0 nas migrations | sem grants de app roles |

Conclusão: **sem gap** migrations↔live nesse eixo. (RLS Supabase Auth não faz parte deste histórico Prisma.)

---

## 3. Compatibilidade PostgreSQL 17 + Prisma

| Item | Status |
|------|--------|
| Server | 17.12 |
| Prisma Client | 5.22.0 |
| Migrations com sintaxe SQLite (`DATETIME` / legado) | **2**: `20260105235359_marketplace_vitrine`, `20260106001446_add_password_and_last_login` |
| Impacto em banco **novo** via `migrate deploy` | **Bloqueia** (já observado no baseline) |
| Migrations Postgres posteriores | Idempotentes (`IF NOT EXISTS`) / compatíveis com PG17 |
| Futuro em staging já baselinado | `migrate deploy` de novas migrations Prisma deve funcionar; **não** reexecutar as 2 SQLite |

**Pendência de longo prazo (repo, não só staging):** substituir/baselinear as 2 migrations SQLite para que `migrate deploy` em banco verde não falhe — fora do escopo de “só staging” sem mudar histórico compartilhado com produção.

---

## 4. Testes CRUD (staging)

Tabelas: `User`, `Company`, `Profile`, `job_postings`, `job_applications`, `job_favorites`, `ProfileMessage`, `password_reset_tokens`.

| Operação | Resultado |
|----------|-----------|
| INSERT + JOIN de leitura | **OK** |
| UPDATE (`Profile.location`, `job_applications.stage`, `ProfileMessage`, token `usedAt`, job title) | **OK** |
| DELETE em ordem FK + verify limpo | **OK** |

Dados de auditoria removidos ao final.

---

## 5. Correções realizadas no staging

| Ação | Detalhe |
|------|---------|
| Remover linha duplicada em `_prisma_migrations` | `20260105235359_marketplace_vitrine` tinha par `rolled_back` + `applied`; removida só a linha `rolled_back` |
| Colunas `publicSlug` / `applicationPhone` | **Não** criadas (evitar drift vs `schema.prisma`) |
| Renomear índices | **Não** (cobertura já equivalente) |
| Novas `migrate resolve --applied` | **Nenhuma** |

`prisma migrate status` após higiene: schema **up to date** (29 applied).

---

## 6. Problemas encontrados (resumo)

1. **Histórico SQLite** impede `migrate deploy` puro em banco vazio (já mitigado pelo baseline).  
2. **2 DDLs de migration** não estão no live nem no `schema.prisma` (supersedidos) — gap de equivalência documental, sem impacto de runtime.  
3. **18 tabelas** só existem via Prisma schema / `db push`, não via SQL das migrations.  
4. **Nomes de índices** divergem; semântica OK.  
5. Sem RLS/policies no schema Prisma — esperado; não é regressão do baseline.

---

## 7. Pendências

| Prioridade | Item |
|------------|------|
| Repo (médio) | Baseline oficial das migrations SQLite para futuros ambientes verdes |
| Opcional | Decidir se `publicSlug` volta ao `schema.prisma` ou se a migration fica só histórica |
| Opcional | Documentar que `applicationPhone` foi substituída por `applicationWhatsapp` |
| Ops | Manter Preview/Vercel apontando ao staging já baselinado; **não** rodar `migrate deploy` em produção sem janela própria |

---

## 8. Veredito

| Critério | Resultado |
|----------|-----------|
| Staging isolado | **OK** |
| Alinhamento live ↔ `schema.prisma` | **OK** (diff vazio) |
| Objetos PR #72 (`password_reset_tokens`, `ProfileMessage.senderRole/replyToId`) | **OK** |
| Integridade FK + CRUD | **OK** |
| Equivalência bit-a-bit migration SQL ↔ live | **Parcial** (2 colunas supersedidas + índices renomeados) |
| Produção / merge / deploy | **Não tocados** |

*Staging apto para smoke do PR #72 em relação ao schema Prisma atual.*
