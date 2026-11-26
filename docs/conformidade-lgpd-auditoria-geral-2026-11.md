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
| Acesso a candidatos | Mantido: desbloqueio + empresa verificada (`canAccessSensitiveProfiles`) + sanitização Art. 11 |
| Textos legais públicos | Privacidade/Uso: 18+, marketing opcional, canal LGPD |
| i18n (12 idiomas + RTL) | Novas chaves `privacy.*` em pt-BR, en e catálogos (incl. `ar`) |

## Já estava correto

- Banner de cookies + opt-in marketing separado da conta  
- Exclusão de conta (profissional/empresa) com remoção best-effort de arquivos  
- Perfis de candidatos só após unlock + verificação de empresa  
- Sem CNPJ/DPO inventados nos termos  
- Template de retenção e checklist DPA/DPO em `docs/`  

## Depende de decisão jurídica ou da empresa

1. Identificação do encarregado (DPO), razão social, CNPJ, endereço  
2. Tabela de retenção com prazos aprovados (PaymentRecord, logs, backups)  
3. DPAs / contratos com Vercel, Supabase, Stripe, Asaas, Hostinger, Google, Upstash, Sentry  
4. Bases legais Art. 11 para campos sensíveis opcionais do cadastro completo  
5. Política de cookies detalhada (inventário)  
6. Traduções oficiais dos textos jurídicos além do fallback pt-BR  
7. Procedimento interno e prazos de atendimento a titulares  
8. Manter ou desligar Google Ads (hoje: opt-in)  

## Riscos remanescentes

- Storage com muitos objetos/pasta: exclusão best-effort pode deixar restos  
- Backups de infra fora do app  
- Campos Art. 11 ainda coletáveis se o titular preencher  
- Rate-limit sem Upstash é frágil em multi-instância  
- Consentimento de marketing de empresa fica só em audit log (sem Profile)  

## Restrições respeitadas

Sem migração de schema, sem apagar dados existentes, sem alterar Stripe/Asaas, sem merge/deploy.
