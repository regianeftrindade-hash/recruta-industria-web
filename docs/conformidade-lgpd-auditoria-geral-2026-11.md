# Auditoria geral LGPD — rodada técnica (26/11/2026)

**Fuso:** America/Sao_Paulo.  
**Escopo:** ajustes técnicos pendentes + verificação.  
**Isto NÃO é parecer jurídico e NÃO declara conformidade LGPD/GDPR.**

---

## Corrigido nesta rodada (técnico)

| Item | Implementação |
|------|----------------|
| Idade mínima 18+ (profissional) | FE: cadastro completo + cadastro rápido; BE: `/api/auth/register`, `/api/auth/register-simple`, `/api/professional/profile` |
| Consentimento de marketing da conta | Opcional, default `false`; estado+data em `formDataJSON` + `SecurityAuditLog`; API `/api/account/marketing-consent`; UI no painel profissional e empresa |
| Google Ads / cookies marketing | Já condicionados a `ri_cookie_consent=marketing` (mantido) |
| Canal oficial | `contato@recrutaindustria.com` na Política de Privacidade e termo LGPD de cadastro |
| Exclusão de conta no painel | Já existia (`DeleteAccountControl`); mantido |
| PaymentRecord | Continua **retido** na exclusão; helper de minimização de PII para respostas/logs; stats admin não devolve `customer` ao cliente |
| Acesso a candidatos | Desbloqueio + cadastro completo + empresa verificada; PATCH tracking exige unlock; mídia assinada exige verificação; sanitize no unlock POST |
| Textos legais públicos | Privacidade/Uso: 18+, marketing opcional, canal LGPD |
| i18n (12 idiomas + RTL) | Novas chaves `privacy.*` em pt-BR, en e catálogos (incl. `ar`) |

## Já estava correto

- Banner de cookies + opt-in marketing separado da conta  
- Exclusão de conta (profissional/empresa) com remoção best-effort de arquivos  
- Perfis de candidatos só após unlock + verificação de empresa  
- Sem CNPJ/DPO inventados nos termos  
- Template de retenção e checklist DPA/DPO em `docs/`  

## Controladora / encarregado (atualização 26/11/2026)

- Controladora informada: **Empresário Individual** enquadrado como **ME**.  
- **Dispensa de indicação de encarregado** registrada com fundamento no art. 11 da Resolução CD/ANPD nº 2/2022 — ver `docs/lgpd-dispensa-encarregado-anpd-2-2022.md`.  
- Canal de titulares mantido: `contato@recrutaindustria.com` (art. 11, § 1º).  
- Ressalva: autoavaliação contínua das exclusões do art. 3º (alto risco art. 4º, receita, grupo econômico). **Não é parecer nem declaração de conformidade integral.**

## Depende de decisão jurídica ou da empresa

1. ~~Identificação obrigatória de DPO~~ — dispensa operacional registrada (ME/EI); publicação de **CNPJ** e **endereço** ainda pendente (não inventar)  
2. Tabela de retenção com prazos aprovados (PaymentRecord, logs, backups)  
3. DPAs / contratos com Vercel, Supabase, Stripe, Asaas, Hostinger, Google, Upstash, Sentry  
4. Bases legais Art. 11 (LGPD) para campos sensíveis opcionais do cadastro completo  
5. Política de cookies detalhada (inventário)  
6. Traduções oficiais dos textos jurídicos além do fallback pt-BR  
7. Procedimento interno e prazos de atendimento a titulares  
8. Manter ou desligar Google Ads (hoje: opt-in)  
9. Revisão periódica da autoavaliação de “alto risco” (Resolução CD/ANPD nº 2/2022, arts. 3º–5º) 

## Riscos remanescentes

- Storage com muitos objetos/pasta: exclusão best-effort pode deixar restos  
- Backups de infra fora do app  
- Campos Art. 11 ainda coletáveis se o titular preencher  
- Rate-limit sem Upstash é frágil em multi-instância  
- Consentimento de marketing de empresa fica só em audit log (sem Profile)  

## Restrições respeitadas

Sem migração de schema, sem apagar dados existentes, sem alterar Stripe/Asaas, sem merge/deploy.
