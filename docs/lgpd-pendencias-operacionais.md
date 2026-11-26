# LGPD — pendências operacionais e jurídicas (atualizado 26/11/2026)

**Data:** 26/11/2026 (America/São Paulo)  
**Escopo:** checklist para elevar conformidade operacional.  
**Isto NÃO é parecer jurídico e NÃO declara conformidade LGPD/GDPR.**

Documentos relacionados: `lgpd-dispensa-encarregado-anpd-2-2022.md`, `conformidade-lgpd-auditoria-final.md`, `auditoria-fornecedores-lgpd.md`.

---

## 1. O que o código já cobre (técnico)

| Tema | Estado no app |
|------|----------------|
| Banner de cookies + opt-in marketing | Implementado (`ri_cookie_consent`) |
| Google Ads só com consentimento marketing | Implementado |
| Aceite de termos/privacidade no cadastro | Implementado |
| Exclusão de conta (perfil + arquivos best-effort) | Implementado |
| Mascaramento de e-mail em logs/respostas | Parcial |
| Rate-limit / auth walls | Implementado |
| Pagamentos BR (Asaas) / INTL (Stripe) | Separados por país de faturamento |

---

## 2. Controladora e encarregado — estado atual

### Controladora (informado pela empresa)

| Campo | Valor | Status |
|-------|-------|--------|
| Forma | Empresário Individual | Informado |
| Porte | ME (Microempresa) | Informado |
| CNPJ | _não informado nesta rodada_ | Pendente (não inventar) |
| Endereço | _não informado nesta rodada_ | Pendente (não inventar) |

### Encarregado (DPO)

| Campo | Valor | Status |
|-------|-------|--------|
| Indicação de encarregado | **Dispensada** (posição operacional) | Ver `docs/lgpd-dispensa-encarregado-anpd-2-2022.md` — art. 11 da Resolução CD/ANPD nº 2/2022 |
| Canal com titulares (art. 11, § 1º) | `contato@recrutaindustria.com` | **Mantido** |
| Autoavaliação art. 3º / 4º (alto risco, receita, grupo) | Dever contínuo da controladora | Ressalva — comprovar à ANPD se solicitado (art. 5º) |

Publicar CNPJ/endereço nos textos de `/termos/privacidade` e `/termos/lgpd` **somente** após a empresa fornecer os dados e com autorização explícita para alterar conteúdo jurídico.

---

## 3. DPAs / operadores — checklist empresarial

Assinar/arquivar contratos de tratamento (ou equivalentes) com:

- [ ] Vercel  
- [ ] Supabase  
- [ ] Asaas  
- [ ] Stripe  
- [ ] Hostinger (e-mail/DNS, se aplicável)  
- [ ] Google (Ads / tags, se mantido)  
- [ ] Upstash (se rate-limit Redis for ativado)  
- [ ] Sentry (se DSN ativo em Production)

Registrar região de processamento e mecanismo de transferência internacional quando houver.

---

## 4. Templates e canais

- `docs/politica-retencao-template.md` — tabela de retenção (prazos em branco para advogado).  
- Canal de titulares: **`contato@recrutaindustria.com`** (canal da dispensa de encarregado — art. 11, § 1º).  
- `public/.well-known/security.txt` — contato técnico de vulnerabilidades (não substitui o canal LGPD).

## 5. Retenção e exclusão — decisões pendentes

| Ativo | Comportamento atual | Decisão necessária |
|-------|---------------------|-------------------|
| `PaymentRecord` | Retido após exclusão de conta | Prazo legal / financeiro |
| `SecurityAuditLog` | Pode permanecer | Prazo de retenção |
| Backups Vercel/Supabase | Fora do app | Processo de purge sob pedido |
| Campos Art. 11 (sensíveis) | Coleta opcional no cadastro completo | Manter, minimizar ou restringir |
| Storage >1000 objetos/pasta | Paginação na exclusão | Validar em staging |

---

## 6. Marketing / Google Ads

- Consentimento: cookie `ri_cookie_consent=marketing` antes de carregar tags.  
- Decisão empresarial: manter Ads com opt-in **ou** desligar completamente.  
- Não declarar base legal aqui — cabe ao advogado.

---

## 7. Minimização e acesso

1. Evitar logs com corpo de request de pagamento/documentos.  
2. Sentry com scrubbing de e-mail/tokens/chaves.  
3. Empresa só acessa documentos após desbloqueio individual.  
4. Não expor secrets em `/api/payment/config` (já true).

---

## 8. O que esta atualização NÃO faz

- Não inventa CNPJ, endereço ou nome de DPO.  
- Não declara conformidade LGPD integral.  
- Não altera funcionalidades, Stripe LIVE, Asaas, planos ou banco.  
- Não altera páginas de termos sem autorização jurídica explícita.
