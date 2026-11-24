# Auditoria de integridade do banco — preparação PR #72

**Data:** 23–24/11/2026 (America/Sao_Paulo)  
**Branch:** `cursor/auditoria-geral-rodada2-06b8`  
**Escopo:** somente leitura. Sem `migrate deploy`, sem `db push`, sem DELETE/UPDATE em dados de negócio, sem merge, sem deploy.

---

## 1. Isolamento staging × produção

| Verificação | Resultado |
|-------------|-----------|
| `DATABASE_URL` neste ambiente | Pooler Supabase `aws-1-us-east-2.pooler.supabase.com:6543`, DB `postgres`, user `postgres.<ref>` |
| `DIRECT_URL` | Mesmo host pooler, porta `5432`, mesmo DB/user |
| Ref do projeto (user) | `yxwgjlzzxkitvcduckgk` — **mesmo projeto** já usado nas auditorias de produção (1.096 vagas) |
| `STAGING_DATABASE_URL` / `TEST_DATABASE_URL` / equivalentes | **AUSENTES** neste ambiente |
| Preview Vercel usa outro Postgres? | **Não confirmado** (sem `VERCEL_TOKEN` / painel) |

### Confirmação de isolamento de staging

**Staging isolado: NÃO COMPROVADO.**  
Neste run só existe conexão ao projeto Supabase de produção acima. Não há segundo banco configurado para testar migrations com segurança.  
**Por isso as migrations do PR #72 NÃO foram aplicadas nem testadas contra um staging.**

---

## 2. Backup e restauração

| Item | Evidência | Conclusão |
|------|-----------|-----------|
| `archive_mode` | `on` | Infraestrutura de archive ativa |
| `wal_level` | `logical` | Compatível com fluxos avançados de backup/réplica |
| Lista de backups no painel Supabase | Sem token Management API / acesso ao dashboard | **Não inspecionado** |
| Teste de restauração (PITR ou daily → projeto clone) | **Não executado** | — |

### Restauração

**Backup recuperável: NÃO DECLARADO.**  
Não houve teste de restore. Existe indício de archive WAL, mas isso **não** prova recuperação operacional.  
Ação sua: no Supabase → Database → Backups, confirmar retenção do plano e, em janela controlada, **restaurar para um projeto novo** (clone) — nunca “às cegas” sobre produção.

---

## 3. Integridade dos dados (SELECT)

Contagens no projeto conectado:

| Entidade | Quantidade |
|----------|------------|
| `User` | 29 (25 PROFESSIONAL, 4 COMPANY) |
| `Company` | 3 (2 EMPRESARIAL, 1 FREE) |
| `Professional` | 5 |
| `Profile` | 9 (todos FREE) |
| `job_postings` PUBLISHED | **1096** (0 outros status) |
| `job_applications` | 3 (0 órfãs de job/user) |
| `job_favorites` | 2 (0 órfãs de job) |
| `PaymentRecord` | 11 (5 PAID / 6 PENDING; todos `pix`; customer preenchido) |
| `ProfileMessage` | 0 |
| `VideoCallInvite` | 21 (todas `ENDED`) |
| Currículos (`Profile.curricoURL`) | 5 |
| Vídeos de apresentação | 0 |

### Relações / órfãos

| Check | Resultado |
|-------|-----------|
| Company sem User | 0 |
| Professional sem User | 0 |
| Profile sem User | 0 |
| ProfileMessage sem Profile | 0 |
| Candidaturas sem vaga/usuário | 0 |
| Favoritos sem vaga | 0 |
| **VideoCallInvite sem Profile** | **21** (todos ENDED; `profileId` aponta para perfis inexistentes) |

Interpretação: convites de vídeo órfãos batem com exclusões anteriores **antes** do scrub da rodada 2. Não bloqueiam migrate; são lixo referencial. O código novo de exclusão passa a limpar esses registros daqui pra frente.

Tabelas Prisma mapeadas que **não existem** no Postgres atual (scaffold / drift):

- `subscriptions`, `plans`, `chat_rooms`, `messages`, `interviews`, `ratings`, …

O app operacional usa `job_postings`, `JobInterview`, `JobProposal`, etc. Risco: caminhos de código que toquem os models scaffold sem `ensure`/migrate quebram com `42P01` — **fora do escopo das duas migrations do PR #72**.

---

## 4. Estado real das migrations

`prisma migrate status` (DIRECT pooler `:5432`):

**Pendentes (disco, não aplicadas):**

1. `20261124020000_password_reset_tokens`  
2. `20261124021000_profile_message_reply_columns`

**Já finalizadas:** 27 nomes distintos até `20261116130000_international_defaults`.

**Rollback histórico (Jan):** existem **duas linhas** em `_prisma_migrations` para cada uma de:

- `20260105235359_marketplace_vitrine`
- `20260106001446_add_password_and_last_login`

uma com `rolled_back_at` e outra com `finished_at`. Cosmético no histórico; `passwordHash`/`lastLogin` existem em `User`. **Não reaplicar.**

---

## 5. Validação das duas migrations do PR #72 (análise estática + inspeção)

### `password_reset_tokens`

| Critério | Resultado |
|----------|-----------|
| Tabela existe hoje? | **Não** |
| SQL | `CREATE TABLE IF NOT EXISTS` + índices únicos/idx |
| Mutação de dados existentes? | Não |
| Risco se deploy sem migrate | Reset de senha falha ao gravar token |

### `profile_message_reply_columns`

| Critério | Resultado |
|----------|-----------|
| Colunas `senderRole` / `replyToId` | **Já existem** |
| Índice `ProfileMessage_replyToId_idx` | **Já existe** |
| SQL | `ADD COLUMN IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS` |
| Efeito esperado em prod | No-op seguro (marca migration como aplicada) |

Compatibilidade Prisma ↔ Postgres para o alvo do PR: após aplicar, `PasswordResetToken` @@map bate; ProfileMessage já alinhado.

---

## 6. Permissões, RLS e Storage

| Área | Estado |
|------|--------|
| RLS em tabelas `public` | **Desligado** em todas as 37 tabelas listadas |
| Papel Prisma | `postgres` com SELECT/INSERT/UPDATE/DELETE em `User` (e capacidade de CREATE em `public`) |
| Schema `storage` | Presente |
| Bucket | `uploads`, **`public: true`** |
| RLS `storage.objects` | **Ligado** |
| Policies em `storage` | **0** |

Risco Storage: bucket marcado público + RLS em objects sem policies — o acesso efetivo depende do uso de **service role** no app (`private-uploads`). Não foi alterado nesta auditoria. Vale revisar no painel (não é bloqueio das migrations do #72).

---

## 7. Riscos para deploy do PR #72

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Deploy do código de reset **sem** `password_reset_tokens` | **ALTO** | Aplicar migrate **antes** ou no mesmo pipeline, com smoke de reset |
| Assumir staging isolado e rodar migrate “de teste” neste `DATABASE_URL` | **CRÍTICO** | Este URL **é** o projeto de produção; não usar como staging |
| Preview Vercel apontando para o mesmo Postgres | **ALTO** (se verdadeiro) | Confirmar env Preview ≠ Production no painel Vercel |
| Órfãos VideoCallInvite | BAIXO | Limpeza opcional futura; não misturar com migrate |
| Drift scaffold (chat/plans) | MÉDIO (latente) | Fora do #72; não ligar `DISABLE_RUNTIME_DDL` sem inventário completo |
| Restauração não testada | MÉDIO (ops) | Clone/restore de backup em projeto separado antes de qualquer incidente |

---

## 8. Testes de migration em staging

**Não realizados** — staging isolado inexistente/não comprovado neste ambiente.

---

## 9. Procedimento seguro futuro (produção)

1. **Confirmar backup** no Supabase (data/hora da última cópia). Ideal: restore de teste para **projeto novo**.  
2. **Criar staging real** (projeto Supabase separado) com dump anonimizado ou clone; **nunca** reutilizar este pooler de produção como “staging”.  
3. Em staging: `prisma migrate deploy` → smoke reset de senha → exclusão de conta de teste → webhooks header.  
4. Em produção (janela curta):  
   - Manter app na versão **sem** depender da tabela, **ou**  
   - Aplicar migrate e só então promover o deploy do #72.  
5. Comando: `npx prisma migrate deploy` com `DIRECT_URL` adequado (host direto `db.<ref>.supabase.co:5432` preferível ao pooler para migrate).  
6. Validar:  
   - `\d password_reset_tokens`  
   - `prisma migrate status` limpo  
   - POST/GET/PATCH de reset em conta de teste  
7. Só então merge/deploy do app se ainda não estiver no ar.  
8. Webhooks: header Asaas/PagSeguro; `WEBHOOK_ALLOW_QUERY_SECRET` só se URL antiga exigir.

**Esta auditoria não executou o passo 4–7 em produção.**

---

## 10. Veredito para merge/deploy agora

| Pergunta | Resposta |
|----------|----------|
| Staging isolado comprovado? | **Não** |
| Restore de backup testado? | **Não** |
| Migrations #72 aplicadas? | **Não** (pendentes) |
| ProfileMessage já pronto para a 2ª migration? | **Sim** (colunas/índice presentes) |
| Seguro mergear/deployar o app #72 agora? | **Não**, até migrar `password_reset_tokens` (e alinhar webhooks) |
| Seguro aplicar só a migration ProfileMessage? | Baixo risco técnico (IF NOT EXISTS), mas prefira as duas juntas na mesma janela |

---

*Nenhum registro de negócio foi modificado. Nenhum secret foi impresso.*
