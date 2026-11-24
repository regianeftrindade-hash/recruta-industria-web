# Auditoria final de lançamento — Recruta Indústria

**Data:** 23/11/2026 (America/Sao_Paulo)  
**Branch de trabalho:** `cursor/auditoria-final-lancamento-06b8`  
**Escopo:** validação técnica de estabilidade para lançamento, com execução de testes.  
**Restrições respeitadas:** sem migrations/`db push`, sem alteração de secrets/Vercel, sem apagar dados, sem cobranças reais, sem deploy.

> Este relatório **não** declara conformidade jurídica LGPD. Pendências legais/contratuais seguem documentadas em `docs/conformidade-lgpd-auditoria-final.md` e `docs/auditoria-fornecedores-lgpd.md`.

---

## 1. Estado inicial encontrado

| Item | Estado |
|------|--------|
| `main` | Inclui PRs #64–#69 (pagamentos sandbox, SEO datePosted, termos, auth por papel, LGPD cookies/exclusão, login na home, auditoria fornecedores) |
| Banco | PostgreSQL Supabase via pooler `us-east-2` (confirmado em auditoria DB anterior) |
| `/api/vagas` | HTTP 200, ~1.096 vagas |
| Migration `international_defaults` | Aplicada |
| Login público | Home; `/login?tipo=*` → home (exceto admin) |
| Google Ads | Condicionado a `ri_cookie_consent=marketing` |

---

## 2. Problemas identificados

| ID | Severidade | Problema | Evidência | Ação nesta auditoria |
|----|------------|----------|-----------|----------------------|
| P1 | **ALTO** (negócio intl) | Stripe em **test mode** em produção (`stripeLiveMode=false`, `stripeTestMode=true`) | `GET /api/payment/config` | **Não alterado** (secret/config Vercel proibido). Cobrança BR via Asaas produção OK (`asaasSandbox=false`) |
| P2 | **MÉDIO** | Dependência transitiva `glob`/`minimatch` via `@sentry/nextjs@10.78` (advisory moderate) | `npm audit --omit=dev` | **Não forçado** upgrade para Sentry 11 (breaking). Risco em tooling de build, não em runtime de negócio |
| P3 | **MÉDIO** (operacional) | `DIRECT_URL` no pooler `:5432` em vez do host direto `db.*.supabase.co` (padrão doc Prisma/Supabase) | Shape de env (auditoria DB) | **Não alterado** (secret). App autentica e opera |
| P4 | **MÉDIO** (jurídico/empresa) | DPAs/DPO/retenção/Art.11 sem fechamento empresarial | Docs LGPD anteriores | Fora do escopo de código |
| P5 | **BAIXO** | Duas migrations antigas rolled-back no histórico `_prisma_migrations` | Auditoria DB | Ruído histórico; schema atual coerente |
| P6 | **BAIXO** | Lint: sem script `lint` no package; `.eslintrc.json` legado vs ESLint 9 (exige `eslint.config.*`) | package.json / tentativa `npx eslint` | Documentado; typecheck cobre TS. Sem migração ESLint nesta rodada |

**Nenhum CRÍTICO de código** (crash, auth quebrada, vazamento de secret no source, Ads sem consentimento, `/api/vagas` fora) foi encontrado nesta passagem.

---

## 3. Arquivos alterados

| Arquivo | Motivo |
|---------|--------|
| `docs/auditoria-final-lancamento.md` | Este relatório (único artefato desta auditoria) |

Nenhuma correção de código foi necessária com segurança sem violar as restrições (DB/secrets/Vercel).

---

## 4. Correções realizadas

Nenhuma correção de runtime. Decisão consciente: não inventar refactors nem upgrades breaking (Sentry 11) na véspera do lançamento.

---

## 5. Testes executados e resultados reais

| Comando / verificação | Resultado |
|------------------------|-----------|
| `npm run typecheck` | **OK** (exit 0) |
| `npm test` (Vitest) | **518 passed**, 3 skipped |
| `npx vitest run lib/i18n lib/payment lib/auth lib/privacy lib/security` | **153 passed** |
| `npm run build` | **OK** |
| E2E local (`smoke-publico`, `conformidade-cookies`, `termos-publicos`, `payment-config-sandbox`) | **16 passed** |
| `npm audit --omit=dev` | **5 moderate** (cadeia Sentry/glob) — sem critical/high |
| Produção `GET /` `/api/vagas` `/api/payment/config` `/termos/*` `/robots.txt` `/sitemap.xml` cadastros | **HTTP 200** |
| Produção `GET /login?tipo=profissional` | **307 → `/?acesso=profissional`** |
| `npm run lint` / ESLint CLI | **Não aprovado como suite** — sem script; CLI ESLint 9 falha sem `eslint.config.*` |

---

## 6. Funcionalidades aprovadas (evidência)

| Área | Evidência |
|------|-----------|
| Home + login público | E2E smoke + redirect 307 em produção |
| Cadastro rápido profissional/empresa | E2E smoke |
| Esqueci senha → volta home | E2E smoke |
| Cookies / Ads opt-in | E2E conformidade (essenciais sem gtag) |
| Termos públicos + links nos cadastros | E2E termos |
| Auth walls (dashboard → home; admin → login) | E2E termos |
| Lista pública de vagas + filtros país/moeda | E2E smoke + API 200 |
| i18n 12 idiomas (chaves críticas + RTL árabe) | Vitest critical-pages + E2E locale |
| Pagamentos config (flags sem secrets) | E2E payment-config + API produção |
| Asaas produção (não sandbox) | `asaasSandbox=false`, webhooks token configurado |
| SEO robots/sitemap | HTTP 200, Allow/Disallow coerentes |
| TypeScript / build | typecheck + build OK |

**Não reexecutados nesta rodada (já cobertos em PRs recentes / dependem de secrets):** E2E empresa/profissional logados contra contas reais.

---

## 7. Problemas ainda existentes

1. Stripe **não** está em live mode → cobranças internacionais reais ainda não devem ser tratadas como prontas.  
2. Advisory moderate no toolchain Sentry.  
3. Fechamento jurídico LGPD (DPO, DPAs assinados, retenção, Art. 11).  
4. Histórico de migrations rolled-back (cosmético operacional).

---

## 8. Dependências externas (sua intervenção)

| # | Ação | Onde |
|---|------|------|
| 1 | Decidir go-live **só BR (Asaas)** vs também **intl (Stripe live)** | Conta Stripe Dashboard + Vercel env (`STRIPE_SECRET_KEY` live) — **sem eu alterar** |
| 2 | Se intl: trocar para `sk_live_` / `pk_live_`, webhook live, revalidar `/api/payment/config` → `stripeLiveMode=true` | Stripe + Vercel |
| 3 | Aceitar/arquivar DPAs (Vercel, Supabase, Asaas, Stripe, Hostinger, Google…) | Painéis dos fornecedores |
| 4 | Publicar dados do controlador/DPO nos termos (com advogado) | Conteúdo jurídico |
| 5 | Confirmar região Function Vercel no painel (auditoria região) | Vercel → Settings → Functions |
| 6 | Opcional: alinhar `DIRECT_URL` ao host direto Supabase | Vercel env (você) |
| 7 | Contas E2E logadas estáveis nos secrets GitHub | GitHub Actions secrets |

---

## 9. Riscos conhecidos

| Risco | Mitigação atual |
|-------|-----------------|
| Cobrança intl acidental em test mode | `stripeLiveMode=false`; UI/config expõe readiness |
| Campos sensíveis Art. 11 | Coleta opcional; decisão empresarial pendente |
| Multi-instância sem Upstash | Rate-limit cai para memória |
| Preview Vercel com secrets | Confirmar escopo Production vs Preview |
| Sentry PII em stack traces | DSN opcional; revisar beforeEnable |

---

## 10. Situação final

### **APTO PARA LANÇAMENTO** — núcleo Brasil (Asaas produção)

Justificativa técnica:

- Build, typecheck e **518** testes unitários verdes.  
- E2E público/cookies/termos/payment-config verdes.  
- Rotas críticas de produção respondendo.  
- Login na home, vagas, cadastros, termos e consentimento de cookies operacionais.  
- Sem CRÍTICO de código/segurança de lançamento detectado nesta auditoria.

### Ressalvas explícitas (não bloqueiam o núcleo BR se aceitas por você)

- **Pagamentos internacionais reais:** aguardar Stripe **live** (hoje test).  
- **LGPD jurídica:** não fechada (DPAs/DPO/retenção) — risco legal, não bug de runtime.  
- **Upgrade Sentry:** adiado de propósito.

Se o lançamento exigir cobrança internacional real **no mesmo dia**, a classificação passa a **NÃO APTO PARA LANÇAMENTO INTL** até `stripeLiveMode=true` validado — sem alterar secrets aqui.

---

*Fim. Nenhum dado de produção foi modificado.*
