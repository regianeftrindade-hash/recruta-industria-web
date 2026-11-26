# Auditoria técnica — fornecedores e transferências internacionais (LGPD)

**Projeto:** Recruta Indústria (`recruta-industria-web`)  
**Data do relatório:** 23/11/2026 (America/Sao_Paulo)  
**Escopo:** inventário técnico de fornecedores, dados pessoais tratados, regiões (quando evidenciáveis) e documentos oficiais (DPA/SCC/políticas).  
**Método:** leitura do código, `.env.example`, docs internas do repositório e páginas oficiais dos fornecedores.  
**Restrições observadas:** nenhum código, banco, secret, cobrança, merge ou deploy foi alterado nesta auditoria (exceto a criação deste arquivo de relatório).

> **Este documento não é parecer jurídico e não declara conformidade integral com a LGPD.**  
> Não inventa CNPJ, DPO, prazos de retenção, foro, regiões de conta ou assinaturas de DPA não verificadas.

### Legenda de status

| Rótulo | Significado |
|--------|-------------|
| **Confirmado por evidência** | Constado no código, schema, `.env.example` ou docs do repositório |
| **Encontrado em documentação oficial** | Publicado pelo fornecedor (DPA, política, termos, SCC) |
| **Não confirmado** | Não há evidência no repositório / sem acesso ao painel da conta |
| **Precisa de ação do titular** | Depende de login nos painéis (Vercel, Supabase, Stripe, etc.) ou de decisão empresarial/jurídica |

---

## 1. Resumo executivo

O Recruta Indústria, pelo código atual, trata dados pessoais principalmente em **PostgreSQL via Prisma** (contas, perfis, mensagens, pagamentos espelhados) e arquivos em **Supabase Storage**. A aplicação é hospedada na **Vercel**. Pagamentos BR usam **Asaas**; pagamentos internacionais usam **Stripe**. E-mail transacional aponta para SMTP **Hostinger**. Autenticação inclui **Google OAuth**. Marketing usa **Google Ads** (só após opt-in de cookies). Rate limiting pode usar **Upstash Redis** (opcional; fallback em memória). Erros podem ir ao **Sentry** (opcional). Há integração de enriquecimento **Datagma**. **OpenAI** e **WhatsApp Cloud API** existem no código, mas estão **desativados por padrão** no `.env.example`.

**Região concreta do banco Supabase, da Function Region da Vercel, do DSN Sentry e da aceitação efetiva dos DPAs nas contas do Recruta: NÃO CONFIRMADOS** — exigem acesso do titular aos painéis.

Há **risco material de transferência internacional** porque: (i) o DPA da Vercel declara processamento primário nos EUA; (ii) Stripe declara transferência a `Stripe, LLC` nos EUA; (iii) Google Ads/OAuth e Sentry/Upstash/GitHub/Datagma publicam mecanismos de transferência internacional (SCC/DPF). Asaas é empresa brasileira, mas sua política oficial admite armazenamento em nuvem fora do Brasil em hipóteses permitidas — a residência efetiva da conta Recruta **não foi confirmada**.

---

## 2. Ambientes (produção / Preview / desenvolvimento)

| Ambiente | Evidência | Fornecedores tipicamente envolvidos | Status |
|----------|-----------|--------------------------------------|--------|
| **Produção** | `NEXTAUTH_URL` / site `www.recrutaindustria.com`; runbook `docs/ops-producao.md` (Vercel Production) | Vercel + Postgres (DATABASE_URL) + Supabase Storage + Asaas/Stripe + SMTP Hostinger + Google + opcionais | **Confirmado por evidência** (uso pretendido); secrets reais **não** inspecionados |
| **Preview (Vercel)** | Deploys de PR via integração Vercel/GitHub (histórico de PRs) | Mesmo runtime Next.js; variáveis Preview **não confirmadas** neste audit | Existência de Preview: **Confirmado**; conteúdo de env Preview: **Não confirmado** |
| **CI (GitHub Actions)** | `.github/workflows/ci.yml` | GitHub runners; smoke E2E builda app local no runner; jobs logados podem apontar produção | **Confirmado por evidência** |
| **Desenvolvimento local** | `.env.example`, `docs/banco-de-testes.md` | Postgres local opcional; SMTP/pagamentos/opcionais só se configurados | **Confirmado por evidência** |

---

## 3. Tabela de fornecedores

| Fornecedor | Serviço no projeto | Dados pessoais (evidência de código) | Finalidade | Região / residência | DPA / SCC / docs oficiais | Situação |
|------------|---------------------|--------------------------------------|------------|---------------------|---------------------------|----------|
| **Vercel** | Hosting / Next.js Functions / Preview | Conteúdo de request (sessão JWT, cookies, formulários), logs de função, builds | Executar a aplicação web | Default público de Functions: `iad1` (EUA) se não alterado; DPA: processamento primário nos EUA. Região **do projeto Recruta**: **Não confirmado** (sem `vercel.json` `regions` no repo) | [DPA](https://vercel.com/legal/dpa); [Legal](https://vercel.com/legal); [Trust](https://security.vercel.com/); [Regions](https://vercel.com/docs/regions) | Uso: **Confirmado**. DPA aceito na conta: **Precisa de ação do titular**. Transferência intl: **provável** (docs oficiais) |
| **PostgreSQL (via Prisma)** | Banco principal (`DATABASE_URL` / `DIRECT_URL`) | User (email, nome, hash senha, país, locale…); Profile (CPF, telefone, bio, campos sensíveis Art. 11 se preenchidos, URLs de arquivos…); Company; PaymentRecord; mensagens; visitas `SiteVisit` (path, referrer, sessionId) | Persistência operacional da plataforma | Host/região do banco: **Não confirmado** (URL não lida; tipicamente Supabase ou outro Postgres gerenciado) | Depende do provedor do Postgres | **Confirmado** o tratamento no schema; provedor/região: **Não confirmado** |
| **Supabase** | Storage privado (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, bucket uploads) | Arquivos: currículos, atestados, avatares, CNH, certificados, logos, vídeos (`professional-videos/…`) | Armazenar/entregar mídia e documentos | Região do projeto: **Não confirmado** | [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum); [Residência/FAQ](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq); [Subprocessors](https://supabase.com/legal/customer-resources/subprocessor-list); [Legal Hub](https://supabase.com/legal) | Integração: **Confirmado**. DPA/região da conta: **Precisa de ação do titular**. Docs oficiais mencionam SCC e transferências (ex.: SG/US) |
| **Asaas** | Gateway BR (Pix/Boleto/cartão); `PAYMENT_PROVIDER=asaas`; APIs sandbox/prod | Nome, e-mail, CPF/CNPJ enviados ao criar customer; IDs/status de cobrança; espelho em `PaymentRecord` | Cobrança Brasil | Empresa BR (**doc oficial**). Política admite nuvem **fora do Brasil** em casos permitidos. Residência da conta Recruta: **Não confirmado** | [Acordo de Processamento](https://central.ajuda.asaas.com/hc/pt-br/articles/45368580595739-Anexo-I-Acordo-de-Processamento-de-Dados-Pessoais); [Política de Privacidade](https://central.ajuda.asaas.com/hc/pt-br/articles/32098003163035-Pol%C3%ADtica-de-Privacidade); [Termos](https://central.ajuda.asaas.com/hc/pt-br/articles/32096847160859-Termos-e-Condi%C3%A7%C3%B5es-de-Uso) | Uso no código: **Confirmado**. Contrato/DPA aceito: **Precisa de ação do titular**. Transferência intl: **possível** (política Asaas), **não confirmada** para esta conta |
| **Stripe** | Checkout internacional (país ≠ BR); webhooks | `customer_email`, metadata (ex. userId, planTier), IDs de sessão/assinatura; PaymentRecord | Cobrança internacional | DPA: transferência a Stripe LLC (EUA). Conta/região Recruta: **Não confirmado** | [DPA](https://stripe.com/legal/dpa); [Data Transfers Addendum](https://stripe.com/legal/dta); [Privacy Center](https://stripe.com/legal/privacy-center) | Uso no código: **Confirmado**. Aceite DPA: **Precisa de ação do titular**. Transferência intl: **Confirmado em docs oficiais** (mecanismo); ocorrência operacional: **provável** quando Stripe está ativo |
| **Hostinger** | SMTP (`smtp.hostinger.com` no código); IMAP citado no admin | Conteúdo de e-mails: destinatário, assunto, corpo (reset senha, candidaturas, notificações), anexos eventuais | Entrega de e-mail transacional | Região do mailbox: **Não confirmado** | [DPA](https://www.hostinger.com/legal/dpa); [Privacy](https://www.hostinger.com/legal/privacy-policy) (via hub legal Hostinger) | Uso pretendido: **Confirmado** (código + mensagens). DPA aceito: **Precisa de ação do titular** |
| **Google — OAuth** | NextAuth provider `Google` (`openid email profile`) | E-mail, nome, imagem de perfil Google; vinculação de conta | Login social | Google processa globalmente (**docs oficiais**). Fluxo Recruta: **Confirmado** | [API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy); [OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies); [Privacy frameworks / SCC](https://policies.google.com/privacy/frameworks) | Uso: **Confirmado**. Termos aceitos no Cloud Console: **Precisa de ação do titular** |
| **Google — Ads** | `GoogleAdsLoader` + conversões (`AW-…`); gated por cookie marketing | Identificadores online / eventos de conversão (cadastro profissional) após opt-in | Marketing / mensuração | Transferências Ads: **docs oficiais** ([adsdatatransfers](https://business.safety.google/adsdatatransfers/); [Ads Processor Terms](https://business.safety.google/adsprocessorterms/)) | Aceite dos Ads Data Protection Terms: **Precisa de ação do titular**. Opt-in no site: **Confirmado** (código) |
| **Upstash** | Redis REST rate-limit (`UPSTASH_REDIS_REST_URL` / `TOKEN`) | Identificadores de rate limit (ex. IP/chave composta) — **não** PII de perfil completo | Mitigar abuso | Região do DB Redis: **Não confirmado**. Fallback memória se env ausente: **Confirmado** | [DPA PDF](https://upstash.com/static/trust/dpa.pdf); [Privacy](https://upstash.com/trust/privacy); [Compliance](https://upstash.com/docs/common/help/compliance) | Código: **Confirmado**. Ativo em produção: **Não confirmado**. DPA: **Precisa de ação do titular** |
| **Sentry** | `@sentry/nextjs` se DSN configurado | Stack traces, URL, contexto de erro; risco de PII se vazar em payload | Observabilidade | Região do projeto Sentry: **Não confirmado** | [DPA](https://sentry.io/legal/dpa/); [Legal](https://sentry.io/legal/); transfers PDF no trust center Sentry | Código/opcional: **Confirmado**. DSN em produção: **Não confirmado** (runbook recomenda). Aceite DPA: **Precisa de ação do titular** |
| **Datagma** | `gateway.datagma.net` enriquecimento / bulk-import | Dados profissionais de perfis importados/enriquecidos (identificação, contato, profissionais) | Ingestão/enriquecimento parceiro | DPA Datagma admite transferência fora do EEE (ex. EUA) | [DPA](https://datagma.com/en/data-processing-agreement); [Privacy](https://datagma.com/en/privacy-policy); [Terms](https://datagma.com/en/terms) | Código: **Confirmado**. Uso em produção e contrato: **Precisa de ação do titular** |
| **GitHub** | Repositório + Actions CI | Código; secrets de Actions (não lidos aqui); possíveis e-mails em logs E2E; metadados de PR | SCM e CI/CD | DPA: transferência/processamento EUA e outros | [Customer Terms / DPA](https://github.com/customer-terms); [Subprocessors](https://docs.github.com/en/site-policy/privacy-policies/github-subprocessors) | Uso: **Confirmado**. Plano/DPA aplicável à org: **Precisa de ação do titular** |
| **OpenAI** | SDK presente; `NEXT_PUBLIC_ENABLE_AI=false` por padrão | Se ativado: textos enviados à API (potencial PII) | IA (preparação) | EUA/global (**docs OpenAI** — não detalhado aqui por estar off) | Política/DPA OpenAI (consultar se ativar) | **Desativado por padrão** (**Confirmado**). Ativação: **Precisa de ação do titular** |
| **WhatsApp (Meta)** | Cloud API stubs; `WHATSAPP_ENABLED=false` | Se ativado: telefones/mensagens | Notificações (preparação) | Meta — **Não aplicável enquanto off** | Políticas Meta Business | **Off por padrão** (**Confirmado**) |
| **PagBank / outros** | `PAGBANK_TOKEN` no `.env.example` (opcional/futuro) | — | Futuro | — | — | **Não evidenciado** como integração ativa no fluxo principal |

---

## 4. Evidências no repositório (código)

| Tema | Onde |
|------|------|
| Supabase Storage | `lib/storage/private-uploads.ts`, exclusão em `lib/account/delete-own-account.ts` |
| Prisma / dados cadastrais | `prisma/schema.prisma` (`User`, `Profile`, `PaymentRecord`, …) |
| Asaas | `lib/payment/asaas-client.ts`, `.env.example` (`PAYMENT_PROVIDER=asaas`) |
| Stripe | `lib/payment/stripe-client.ts`, webhooks API |
| SMTP Hostinger | `lib/infra/email.ts` (`smtp.hostinger.com`) |
| Google OAuth | `lib/auth/auth.config.ts` |
| Google Ads + consentimento | `components/analytics/GoogleAdsLoader.tsx`, `lib/analytics/google-ads.ts`, `lib/privacy/cookie-consent.ts` |
| Visitas 1º partido | `components/app-shell/SiteVisitTracker.tsx` → `/api/analytics/visit` → tabela `SiteVisit` |
| Upstash | `lib/security/rate-limit.ts` |
| Sentry | `instrumentation.ts`, `sentry.*.config.ts`, `docs/ops-producao.md` |
| Datagma | `lib/integrations/datamagnet-client.ts`, rotas `app/api/integrations/datagma/**` |
| Vercel ops | `docs/ops-producao.md`, `docs/e2e-secrets.md` |
| CI | `.github/workflows/ci.yml` |
| Sessão JWT (não DB de sessão NextAuth) | `lib/auth/auth.config.ts` → `session.strategy: 'jwt'` |

**Valores de secrets, tokens e dados pessoais reais não foram lidos nem reproduzidos.**

---

## 5. Fontes oficiais (links)

| Fornecedor | Links |
|------------|-------|
| Supabase | https://supabase.com/legal/customer-resources/data-processing-addendum · https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq · https://supabase.com/legal/customer-resources/subprocessor-list |
| Vercel | https://vercel.com/legal/dpa · https://vercel.com/docs/regions · https://security.vercel.com/ · https://vercel.com/docs/security/compliance |
| Stripe | https://stripe.com/legal/dpa · https://stripe.com/legal/dta · https://stripe.com/legal/privacy-center |
| Asaas | https://central.ajuda.asaas.com/hc/pt-br/articles/45368580595739-Anexo-I-Acordo-de-Processamento-de-Dados-Pessoais · https://central.ajuda.asaas.com/hc/pt-br/articles/32098003163035-Pol%C3%ADtica-de-Privacidade |
| Hostinger | https://www.hostinger.com/legal/dpa |
| Google Ads | https://business.safety.google/adsprocessorterms/ · https://business.safety.google/adsdatatransfers/ |
| Google OAuth | https://developers.google.com/terms/api-services-user-data-policy |
| Upstash | https://upstash.com/static/trust/dpa.pdf · https://upstash.com/trust/privacy |
| Sentry | https://sentry.io/legal/dpa/ · https://sentry.io/legal/ |
| Datagma | https://datagma.com/en/data-processing-agreement · https://datagma.com/en/privacy-policy |
| GitHub | https://github.com/customer-terms · https://docs.github.com/en/site-policy/privacy-policies/github-subprocessors |

---

## 6. Transferências internacionais identificadas

| Fluxo | Evidência | Status |
|-------|-----------|--------|
| App na Vercel → processamento em infra global/EUA | DPA Vercel § processamento primário EUA; default Function `iad1` | Docs oficiais: **sim**. Conta Recruta: **Não confirmado** se permanece no default |
| Dados de pagamento → Stripe LLC (EUA) | Stripe DPA / DTA | **Encontrado em documentação oficial**; ativo quando Stripe é usado |
| Google Ads / OAuth | Google Ads data transfers + policies | **Encontrado em documentação oficial**; Ads só com opt-in (**Confirmado** no código) |
| E-mails via Hostinger | DPA Hostinger (SCC); mailbox region unknown | Transferência: **Não confirmado** sem região da conta |
| Supabase Storage / possível Postgres Supabase | FAQ residência + DPA (SCC) | Transferência: **possível**; região do projeto: **Não confirmado** |
| Upstash Redis | DPA + DPF | **possível** se Redis configurado |
| Sentry | DPA + DPF/SCC | **possível** se DSN ativo |
| Datagma | DPA admite fora do EEE | **possível** quando integração usada |
| GitHub Actions / SCM | DPA GitHub (EUA) | Código e CI: **Confirmado** uso; dados pessoais em logs: risco residual |
| Asaas | Política admite nuvem fora do BR | **possível**; **não confirmado** para a conta |

---

## 7. Lacunas documentais e riscos (técnicos / operacionais)

1. **Sem inventário assinado** de DPAs/SCCs da conta Recruta (titular precisa baixar/aceitar e arquivar).  
2. **Região do banco e do Storage** não estão no repositório → impacta análise de transferência e de função Vercel próxima aos dados.  
3. **Campos sensíveis (Art. 11)** no `Profile` podem residir no mesmo Postgres e ser expostos a empresas conforme regras de produto — risco de base legal (jurídico), não resolvido aqui.  
4. **Sentry / logs / e-mail**: risco de PII incidental em stack traces ou SMTP (dev loga trechos em desenvolvimento).  
5. **PaymentRecord retido** após exclusão de conta (decisão já documentada em auditoria LGPD anterior) — retenção sem prazo publicado.  
6. **Preview Vercel**: se secrets de produção forem espelhados, Preview trata dados reais — **Não confirmado**.  
7. **Datagma**: enriquecimento B2B com transferência internacional declarada — exige base legal e contrato claros.  
8. **Não presumir** DPA “aceito” só porque o fornecedor publica o texto.

---

## 8. Pendências — titular da conta (checklist operacional)

1. Vercel: plano (Hobby/Pro/Enterprise), Function Region, confirmação de DPA, lista de subprocessors, variáveis Production vs Preview.  
2. Supabase: região do projeto, se Postgres = Supabase, DPA aceito, bucket policies, backups.  
3. Asaas: contrato, Anexo I / acordo de processamento, confirmação se dados saem do Brasil.  
4. Stripe: DPA incorporado à conta, país da entidade contratante, produtos live vs test.  
5. Hostinger: DPA, localização do e-mail `contato@…`, retenção de caixas.  
6. Google Cloud Console: OAuth consent screen, privacy policy URL, Ads Data Protection Terms.  
7. Upstash: se `UPSTASH_*` está em Production e em qual região.  
8. Sentry: se DSN está ativo, região US/EU, DPA assinado no org.  
9. Datagma: contrato comercial + DPA e finalidade jurídica do enriquecimento.  
10. GitHub: plano da org e se DPA Enterprise/Teams se aplica.  
11. Arquivar PDFs/versões dos DPAs com data e responsável.  
12. Encaminhar este inventário a advogado para parecer sobre arts. 33–36 LGPD e cláusulas de transferência.

---

## 9. Recomendações priorizadas por risco

| Prioridade | Ação | Motivo |
|------------|------|--------|
| **P0** | Confirmar e arquivar DPA/SCC (ou equivalente LGPD) de **Vercel, Supabase, Asaas, Stripe, Hostinger, Google** | Base contratual de operador/transferência |
| **P0** | Confirmar **região** do Postgres e do Supabase Storage; alinhar Function Region Vercel | Evidência de transferência e latência/residência |
| **P1** | Confirmar se **Sentry** e **Upstash** estão ativos em produção; se sim, DPA + minimização de PII em eventos | Risco de exportação de dados de erro/IP |
| **P1** | Revisar **Preview**: não espelhar secrets de produção com dados reais, ou restringir acesso | Evitar tratamento não controlado em ambientes efêmeros |
| **P1** | Decisão explícita sobre **Datagma** (manter/contratar/desligar) e base legal | Transferência internacional declarada no DPA do fornecedor |
| **P2** | Inventário de cookies/ferramentas (já iniciado na política) com validação jurídica | Alinhar texto × sistema |
| **P2** | Política de retenção de `PaymentRecord` e logs pós-exclusão | Já mapeado como pendência empresarial/jurídica |
| **P3** | Se ativar OpenAI/WhatsApp no futuro, reabrir auditoria **antes** do go-live | Hoje off por padrão |

---

## 10. Checklist final — futura validação jurídica

- [x] Controladora: forma **Empresário Individual / ME** informada; canal `contato@`; encarregado **dispensado** (art. 11 Res. CD/ANPD nº 2/2022) — ver `docs/lgpd-dispensa-encarregado-anpd-2-2022.md`  
- [ ] CNPJ e endereço da controladora para publicação — **não inventados**  
- [ ] Lista de operadores/subprocessadores publicada ou arquivada internamente  
- [ ] DPAs/contratos aceitos com data/versão para cada fornecedor ativo  
- [ ] Mapa de transferências internacionais + mecanismo (SCC, cláusulas ANPD, etc.)  
- [ ] Regiões confirmadas (Vercel, DB, Storage, e-mail, Sentry, Upstash)  
- [ ] Bases legais por finalidade (incl. Art. 11 e marketing)  
- [ ] RIPD / avaliação de impacto se aplicável  
- [ ] Procedimento de atendimento a titulares alinhado à exclusão técnica  
- [ ] Revisão dos textos `/termos/privacidade` e `/termos/uso` contra este inventário  
- [ ] Parecer escrito de advogado — **este relatório não o substitui**

---

## 11. Revisão de consistência deste relatório

| Verificação | Resultado |
|-------------|-----------|
| Só um arquivo novo (`docs/auditoria-fornecedores-lgpd.md`)? | Sim (entrega desta tarefa) |
| Secrets/valores reais citados? | Não |
| Regiões de conta inventadas? | Não — marcadas **Não confirmado** |
| DPA “assinado” afirmado sem evidência? | Não — **Precisa de ação do titular** |
| OpenAI/WhatsApp tratados como ativos? | Não — off por padrão no `.env.example` |
| Conformidade LGPD integral declarada? | Não |
| Distinção evidência código × docs oficiais × lacuna? | Sim (legenda § início) |

---

*Fim do relatório técnico. Próximo passo recomendado: titular da conta preencher as pendências da §8 e submeter o pacote a validação jurídica.*
