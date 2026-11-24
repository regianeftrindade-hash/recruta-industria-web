# Auditoria geral — Recruta Indústria

**Rodada 1:** 23/11/2026 — branch `auditoria-geral-20261123` (PR #70).  
**Rodada 2:** 23–24/11/2026 (America/Sao_Paulo) — branch `cursor/auditoria-geral-rodada2-06b8`.

Produção e banco **não** foram alterados nesta rodada. Não houve `migrate deploy`, `db push`, `DROP`, `TRUNCATE`, exclusão de usuários/vagas/pagamentos, rotação de segredos, mudança na Vercel nem deploy.

Base da rodada 2: `origin/main` (`e9eed47`, pós PR #71) + merge do PR #70 (ainda aberto).

---

## 1. Estado inicial (pós PR #70 + #71)

Já resolvido na rodada 1 (código no PR #70): bypass empresarial por substring, `POST /api/auth/login` 410, IP via `x-vercel-forwarded-for`, Pix/boleto com Stripe bloqueado, filtros de vagas, `payment/config` sem Asaas anônimo, cadastro sem `error.message` interno, analytics visit 500.

Já validado em auditorias anteriores: 1.096 vagas, migration `international_defaults`, login na home, Ads com consentimento, LGPD cookies/exclusão técnica parcial.

---

## 2. Vulnerabilidades / problemas — rodada 2

### Corrigidos no código

| ID | Sev. | Problema | Correção |
|----|------|----------|----------|
| R2-1 | **ALTO** | Reset de senha: one-time só em memória | Tabela `password_reset_tokens` + emissão/consumo atômico (hash SHA-256). Migration criada, **não aplicada em prod**. |
| R2-2 | **ALTO** | Sessão Google usava `sub` do Google ≠ cuid Prisma (vídeos 403) | `jwt` grava `token.sub = dbUser.id`; `/api/media/sign` resolve cuid por e-mail para `professional-videos/`. |
| R2-3 | **MÉDIO** | Webhook Asaas/PagSeguro aceitava segredo na query | Headers obrigatórios em produção; query só com `WEBHOOK_ALLOW_QUERY_SECRET=true` ou em dev. |
| R2-4 | **MÉDIO** | Upload anônimo em pastas sensíveis | Pastas empresa/CNH/certificados exigem login; pré-cadastro (`documents`/`curriculos`/`avatars`/…) permanece anônimo com limite 5 MB e rate menor. |
| R2-5 | **MÉDIO** | JSON-LD: `directApply: true` sempre; salário sem valor | `directApply` só `INTERNAL`; `baseSalary` só com número parseável; senão salário vai na description. |
| R2-6 | **MÉDIO** | hreflang falso (12 locales → mesma URL) | Sitemap/layout/vaga/termos: só `pt-BR` + `x-default`. |
| R2-7 | **MÉDIO** | Exclusão deixava chat/entrevistas/convites/vídeo/telemetria | Scrub explícito + redação de PII em `PaymentRecord.customer` (registro financeiro retido). |
| R2-8 | **MÉDIO** | Convite de equipe aceitava senha de 6 chars | Mínimo 8. |
| R2-9 | **BAIXO** | Datas de UI no fuso do processo (UTC na Vercel) | `formatUiDate`/`DateTime` default `America/Sao_Paulo`. |
| R2-10 | **BAIXO** | `ProfileMessage.senderRole`/`replyToId` sem migration | Migration idempotente criada (não aplicada em prod). |
| R2-11 | **BAIXO** | pt-PT com frases longas iguais ao pt-BR | Helper `europeanizePtPt` + overrides editoriais onde ainda eram cópia literal; superfície auth/home já estava europeia. |
| R2-12 | **BAIXO** | CSP `object-src` / revisão unsafe-inline | Revisado: `unsafe-inline` permanece (Next/Ads/JSON-LD) até nonce; documentado. Sem remoção abrupta. |

### Pendentes (exigem ação externa ou risco)

| ID | Sev. | Pendência |
|----|------|-----------|
| P-1 | **ALTO** (só intl) | Stripe ainda em test mode em produção (não alterado — secrets). |
| P-2 | **MÉDIO** | Aplicar migrations `20261124020000_password_reset_tokens` e `20261124021000_profile_message_reply_columns` no Postgres **quando autorizado** (não feito aqui). Até lá, reset de senha **quebra em runtime** se o código for deployado sem a tabela. |
| P-3 | **MÉDIO** | No painel Asaas/PagSeguro: cadastrar webhook com **header**, não `?token=`. Se URL antiga com query, setar temporariamente `WEBHOOK_ALLOW_QUERY_SECRET=true`. |
| P-4 | **MÉDIO** | Fechamento jurídico LGPD (DPO/DPAs/retenção Art.11). |
| P-5 | **BAIXO** | CSP sem nonce (`unsafe-inline` necessário para Next/Ads). |
| P-6 | **BAIXO** | Upload anônimo ainda existe para pré-cadastro (mitigado). Melhoria futura: ticket assinado no formulário de cadastro. |
| P-7 | **INFO** | Migrations Jan `20260105235359` / `20260106001446` marcadas rollback em 08/09/2026: eram SQLite-era; efeito útil coberto pelo schema Postgres atual + migrations posteriores. **Não reaplicar.** |

---

## 3. Arquivos alterados (rodada 2)

Principais:

- `lib/security/password-reset-token.ts`, `security.server.ts`, `webhook-auth.ts`
- `app/api/auth/password-reset/route.ts`
- `lib/auth/auth.config.ts`, `app/api/media/sign/route.ts`
- `app/api/asaas/webhook/route.ts`, `app/api/pagseguro/webhook/route.ts`
- `app/api/upload/route.ts`
- `lib/account/delete-own-account.ts`
- `app/vagas/[id]/page.tsx`, `app/sitemap.ts`, `app/layout.tsx`, `app/termos/[slug]/page.tsx`
- `lib/i18n/format-ui.ts`, `pt-pt-europeanize.ts`, `messages/catalogs/pt-PT.json`
- `lib/company/company-team.ts`, `lib/security/security.ts`
- `prisma/schema.prisma` + migrations novas
- `.env.example`
- Testes em `lib/security/__tests__/*`, `lib/account/__tests__/*`, `lib/i18n/__tests__/pt-pt-europeanize.test.ts`
- Inclui alterações herdadas do PR #70 (bypass, login 410, filtros, gateway, etc.)

---

## 4. Migrations criadas (não executadas em produção)

| Migration | Justificativa |
|-----------|---------------|
| `20261124020000_password_reset_tokens` | Persistência multi-instância do reset (indispensável para R2-1). |
| `20261124021000_profile_message_reply_columns` | Alinha schema com colunas já existentes em prod via DDL runtime; idempotente. |

**Ordem sugerida (manual, após review):** `prisma migrate deploy` em staging → smoke reset → produção em janela controlada. Até aplicar, **não fazer merge/deploy** desta branch para produção sem a tabela.

---

## 5. Testes executados (resultados reais)

| Comando | Resultado |
|---------|-----------|
| `npx prisma generate` | OK |
| `npm run typecheck` | OK (exit 0) |
| `npm test` (Vitest) | **535 passed**, 3 skipped |
| Foco rodada 2 (reset, webhook, upload, delete scrub, pt-PT, + suite PR #70) | 40/40 no lote intermediário |
| `npm run build` | **OK** (exit 0) |
| E2E Playwright / login real / cobrança | **Não executados** (sem mutação em prod) |
| `npm run lint` | Script inexistente — não aprovado |

---

## 6. Migrations rollback (investigação)

| Migration | Marcação | Estado real |
|-----------|----------|-------------|
| `20260105235359_marketplace_vitrine` | rollback 08/09/2026 | Bootstrap SQLite (`User`/`Company` iniciais). Schema Postgres atual veio de migrations 2026-06+ e unificações 09/2026. |
| `20260106001446_add_password_and_last_login` | rollback 08/09/2026 | Adicionava `passwordHash`/`lastLogin` em SQLite. Colunas existem hoje no Postgres (app autentica). **Não reexecutar** o SQL SQLite. |

Conclusão: histórico cosmético; sem ação destrutiva.

---

## 7. Configurações externas necessárias

1. **Antes do deploy desta branch:** aplicar migration `password_reset_tokens` (e opcionalmente ProfileMessage columns).
2. **Asaas:** webhook com header `asaas-access-token` = token; remover `?token=` da URL quando possível.
3. **PagSeguro/PagBank:** header `x-webhook-secret` (ou `x-pagseguro-secret`).
4. **Vercel (opcional migração):** `WEBHOOK_ALLOW_QUERY_SECRET=true` só enquanto a URL antiga existir.
5. **Stripe live** se go-live internacional.
6. **Google OAuth:** usuários já logados recebem cuid no próximo sync JWT (≤5 min) ou novo login.

---

## 8. Riscos residuais

- Deploy do código de reset **sem** migration → falha ao pedir nova senha.
- Webhook com URL `?token=` e sem `WEBHOOK_ALLOW_QUERY_SECRET` → 401 e assinaturas desatualizadas.
- Upload anônimo de pré-cadastro ainda permite pasta `anon/` se o form não enviar e-mail.
- PaymentRecord retido (legal) com customer redigido na exclusão — revisão jurídica da política.
- CSP `unsafe-inline` permanece.

---

## 9. Situação

**Código da rodada 2 pronto para review/merge após aplicar migrations em ambiente controlado.**  
**Não apto a deploy cego em produção** até P-2 (migration reset) e alinhamento de webhooks (P-3).

Núcleo público já auditado (vagas, home, i18n, Asaas config) permanece operacional; esta branch endurece auth, arquivos, pagamentos webhook e LGPD de exclusão.

---

*Fim da rodada 2. Nenhum dado de produção foi modificado.*
