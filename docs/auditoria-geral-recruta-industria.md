# Auditoria geral — Recruta Indústria

Data: 23/11/2026. Base lida: `origin/main` em `b320fed` (PR #69). Branch desta auditoria: `auditoria-geral-20261123`.

Produção e banco não foram alterados. Não houve `migrate`, `db push`, `DROP`, `TRUNCATE`, `DELETE`, rotação de segredo, mudança de variável na Vercel nem deploy.

## O que já estava concluído

Não foi reaberto o que os PRs #57–#69 e os relatórios `docs/conformidade-lgpd-auditoria-final.md` e `docs/auditoria-fornecedores-lgpd.md` já fecharam: colunas `countryCode`, `locale`, `currency` e `timeZone`, cookie de idioma, aceite nos cadastros e a separação do banco de testes.

Leitura somente de `SELECT` no Postgres de produção, com a URL da aplicação (pooler, papel `postgres`), não com a API pg-meta:

- PostgreSQL 17.6, banco `postgres`, projeto Supabase `yxwgjlzzxkitvcduckgk`, pooler `aws-1-us-east-2`.
- 1.096 vagas `PUBLISHED`, igual ao `GET /api/vagas` (HTTP 200).
- Migration `20261116130000_international_defaults` concluída em 23/11/2026 11:23:42 UTC, sem rollback.
- `ProfileMessage` já tem `senderRole` e `replyToId` neste banco.
- Nenhuma tabela em `public` está com `relrowsecurity = true`.
- 27 migrations concluídas. Duas linhas antigas estão marcadas como rollback (`20260105235359_marketplace_vitrine` em 08/09/2026 e `20260106001446_add_password_and_last_login` em 08/09/2026). O site autentica e lista vagas, então o efeito útil dessas migrations foi coberto por migrations posteriores. Não foi reexecutado nada.

## Escopo que não foi executado

| Verificação | Motivo |
|---|---|
| Painel Vercel (Production/Preview, variáveis, domínios) | Não há `VERCEL_TOKEN` nem projeto vinculado. A CLI não baixou (`UNABLE_TO_VERIFY_LEAF_SIGNATURE` no registro npm). |
| Stripe, Asaas e PagSeguro no painel | Sem acesso ao painel. Nenhuma chave foi lida nem classificada como test/live. |
| SMTP Hostinger e entrega real | Sem envio de e-mail. |
| Google Cloud / OAuth no console | Sem acesso ao console. |
| Backup do Supabase | Sem acesso ao painel. |
| RLS e políticas de Storage no painel | No banco, RLS está desligado nas tabelas `public`. Policies de Storage não foram lidas. |
| Suíte Vitest inteira, E2E, build de produção, lint | Lint não existe em `package.json`. E2E logado grava na produção e não foi executado. O build de produção não foi rodado. |
| Páginas bloqueadas (home, login, dashboards, cadastros) | Nenhuma foi editada nem percorrida no navegador nesta auditoria. |

DNS público conferido: `recrutaindustria.com` resolve para `76.76.21.21` e `www` aponta para `cname.vercel-dns.com`.

A cópia local de 26/09/2026 (fora deste repositório) ainda autentica no mesmo banco. Nela, `DATABASE_URL` é o pooler na porta 6543 com `pgbouncer=true`, e `DIRECT_URL` é o mesmo host na porta 5432 (pooler de sessão, não o host `db.<projeto>.supabase.co`). Isso não prova que a Vercel esteja idêntica hoje. A Vercel não foi lida.

## Problemas

### CRÍTICO — RESOLVIDO no código, ainda publicado o comportamento antigo

**Bypass empresarial por substring.** `lib/company/company-test-bypass-shared.ts` tratava como conta de teste qualquer e-mail, nome ou razão social que *contivesse* a chave `paizaonacozinha`, e lia `NEXT_PUBLIC_COMPANY_TEST_BYPASS_KEYS` (vai para o bundle). No login, `ensureCompanyTestBypassReady` gravava `planTier = EMPRESARIAL`.

Correção: comparação exata do e-mail ou do nome normalizado. No nome, só o sufixo societário `ltda`, `me`, `mei`, `eireli` ou `sa` continua válido, para manter “Paizao Na Cozinha LTDA”. A variável `NEXT_PUBLIC_*` deixou de entrar na lista. Contas que já estão `EMPRESARIAL` no banco não foram reescritas.

Teste: `lib/company/__tests__/company-test-bypass-shared.test.ts` e `lib/admin/__tests__/admin-exclude-test-accounts.test.ts`.

### ALTO — RESOLVIDO no código

**`POST /api/auth/login` conferia senha e não abria sessão.** A rota não é chamada pelo front. Em produção, um `POST` com corpo `{}` ainda responde HTTP 400 (rota antiga, antes deste PR). A rota passou a responder 410, sem ler senha nem usuário.

**Limite por IP usava o primeiro `X-Forwarded-For`.** O cliente pode prefixar esse header. `clientIpFromHeaders` passa a preferir `x-vercel-forwarded-for`, depois `x-real-ip`, e só então o último salto de `x-forwarded-for`. Usado no NextAuth, nos dois cadastros e no proxy, que já chamava `getClientIp`.

Teste: `lib/security/__tests__/api-guard.test.ts`.

**Pix/boleto com `PAYMENT_PROVIDER=stripe` ia para o Asaas.** `createGatewayPayment` tratava todo provedor que não fosse PagSeguro como Asaas. Agora Stripe lança erro e a compra de assentos extras responde 501, sem chamar o Asaas. Cobrança brasileira com Asaas configurado segue igual. Nenhuma chave foi alterada.

Teste: `lib/payment/__tests__/gateway-provider.test.ts`.

### MÉDIO — RESOLVIDO no código

**Períodos de vaga usavam relógios diferentes.** `24h` filtrava `publishedAt`; `7`, `15` e `30` filtravam `publicationDate`. Os quatro passam a usar `publishedAt` em janela contínua.

**“A combinar” ignorava a moeda.** Com `moeda` e `salario=negociavel`, o filtro de moeda voltou a ser aplicado.

**UF brasileira com outro país.** `estado` só entra quando o país está vazio ou é `BR`.

Testes em `lib/jobs/__tests__/job-search.test.ts`.

**`GET /api/payment/config` consultava o Asaas sem sessão.** A verificação remota e a mensagem do gateway ficam restritas a desenvolvimento ou usuário logado. Visitante recebe “Disponível após o login.” e não dispara `verifyAsaasCredentials`.

**Cadastro devolvia `error.message`.** O `POST /api/auth/register` responde a mensagem genérica já traduzida.

**Visita com falha respondia HTTP 200.** `POST /api/analytics/visit` passa a responder 500 quando a gravação falha.

### ALTO — em aberto

**Token de redefinição de senha é de uso único só na memória do processo.** `lib/security/security.server.ts` guarda o nonce num `Set`. Outra instância da Vercel aceita o mesmo link até o fim da hora. Correção segura exige Redis ou coluna nova. Não foi criada migration nem foi escrito nada no banco.

**Sessão Google usa o `sub` da conta Google, não o id do Prisma.** `lib/auth/auth.config.ts` faz `allowDangerousEmailAccountLinking` e não grava `token.sub` com o `cuid`. A ACL de vídeo em `professional-videos/{userId}/` compara com o id errado e nega o dono. Não foi alterado nesta branch para não mudar o formato da sessão sem um teste de login real.

### MÉDIO — em aberto

**Segredo de webhook Asaas/PagSeguro também é aceito na query string.** Mudar isso pode derrubar o webhook se o painel estiver cadastrado com `?token=`. Não foi alterado.

**Upload anônimo aceita documento em pasta pré-cadastro.** Restringir a pasta quebra o cadastro atual, cuja página está bloqueada. Não foi alterado.

**JSON-LD da vaga** (`app/vagas/[id]/page.tsx`) coloca o salário como texto e `directApply: true` também para WhatsApp, e-mail e site externo.

**`hreflang` repete a mesma URL** para os 12 idiomas em `app/sitemap.ts` e na página da vaga. O idioma é cookie, não caminho.

**pt-PT reutiliza frases longas do pt-BR.** Não foi reescrito catálogo sem revisão humana.

**Datas de interface usam o fuso do processo** (`lib/i18n/format-ui.ts`), que na Vercel é UTC.

**Exclusão de conta não apaga mensagens de chat, entrevistas e convites de vídeo** sem FK (`lib/account/delete-own-account.ts`). Não foi executada exclusão.

**Convite de equipe aceita senha de 6 caracteres** (`lib/company/company-team.ts`), abaixo da regra do restante do site.

**`ProfileMessage.senderRole` e `replyToId` não estão numa migration**, embora existam neste banco (DDL de runtime já rodou). Um banco novo só com `migrate deploy` e `DISABLE_RUNTIME_DDL=true` quebra a listagem. Não foi adicionada migration para não sugerir execução em produção neste PR.

### BAIXO

**CSP de produção inclui `script-src 'unsafe-inline'`.** Tirar isso sem medir Google Ads e o Next pode quebrar a home. HSTS está presente nas respostas de produção.

**Duas migrations constam como rollback desde setembro.** Não impedem o tráfego atual. Não foram reaplicadas.

### DEPENDÊNCIA EXTERNA

1. Confirmar na Vercel Production e Preview, sem revelar valores: `DATABASE_URL` no pooler 6543 com `pgbouncer=true`; `DIRECT_URL` na 5432; `PAYMENT_PROVIDER` coerente com Asaas no Brasil e Stripe fora; chaves Stripe test/live não misturadas; `ASAAS_API_URL` coerente com a chave; `DISABLE_RUNTIME_DDL` só depois do migrate.
2. Confirmar no painel Asaas/PagSeguro se o webhook usa header e não `?token=`.
3. Decidir se o token de reset passa a ser persistido (Redis já usado no rate limit, ou tabela nova).
4. Ligar RLS no Supabase só com uma política revisada. Hoje o Prisma usa um papel que ignora RLS; ligar no escuro derruba a API.
5. Revisar backup e região do projeto `yxwgjlzzxkitvcduckgk` no painel.
6. Conferir SPF/DKIM/DMARC da Hostinger com um envio real (`docs/dns-spf-dmarc-hostinger.md`).
7. No Google Cloud, conferir origens autorizadas de `https://www.recrutaindustria.com` e se a conta Google exige e-mail verificado antes de vincular.

## Testes executados

Aprovados em 23/11/2026, nesta branch, 31 testes em 6 arquivos:

- `lib/company/__tests__/company-test-bypass-shared.test.ts`
- `lib/company/__tests__/corporate-and-seats.test.ts`
- `lib/admin/__tests__/admin-exclude-test-accounts.test.ts`
- `lib/security/__tests__/api-guard.test.ts`
- `lib/payment/__tests__/gateway-provider.test.ts`
- `lib/jobs/__tests__/job-search.test.ts`

`tsc --noEmit` terminou sem erro.

Smoke público, sem corpo gravado:

- `GET /api/vagas` → 200
- `GET /robots.txt` → 200
- `GET /sitemap.xml` → 200
- `GET /api/auth/login` → 405
- `POST /api/auth/login` com `{}` → 400 (produção ainda na rota antiga)

Não executados: Vitest completo, testes de integração que gravam, Playwright, build `next build`, lint (não há script), login real, cadastro real, candidatura real, webhook de pagamento.
