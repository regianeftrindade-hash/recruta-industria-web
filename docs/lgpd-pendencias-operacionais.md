# LGPD — pendências operacionais e jurídicas (pós-auditoria 8,0)

**Data:** 26/11/2026 (America/São Paulo)  
**Escopo:** checklist para elevar conformidade operacional.  
**Isto NÃO é parecer jurídico e NÃO declara conformidade LGPD/GDPR.**

Documentos técnicos relacionados: `conformidade-lgpd-auditoria-final.md`, `auditoria-fornecedores-lgpd.md`.

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

## 2. Encarregado (DPO) — depende de decisão humana

Preencher **somente** com dados reais da empresa (não inventar):

| Campo | Valor (empresa) | Status |
|-------|-----------------|--------|
| Nome do encarregado / DPO | _a definir_ | Pendente |
| E-mail de contato titular | hoje: `contato@recrutaindustria.com` (operacional) | Confirmar canal exclusivo |
| Razão social da controladora | _a definir_ | Pendente |
| CNPJ | _a definir_ | Pendente |
| Endereço da controladora | _a definir_ | Pendente |

Após preenchimento por responsável + revisão de advogado, publicar nos textos de `/termos/privacidade` e `/termos/lgpd` (alteração de conteúdo jurídico exige autorização explícita).

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

## 4. Templates preparados nesta rodada

- `docs/politica-retencao-template.md` — tabela de retenção (prazos em branco para advogado).  
- Canal de titulares sugerido: `contato@recrutaindustria.com` até existir e-mail do DPO.  
- `public/.well-known/security.txt` — contato técnico de vulnerabilidades (não substitui DPO).

## 5. Retenção e exclusão — decisões pendentes

| Ativo | Comportamento atual | Decisão necessária |
|-------|---------------------|-------------------|
| `PaymentRecord` | Retido após exclusão de conta | Prazo legal / financeiro |
| `SecurityAuditLog` | Pode permanecer | Prazo de retenção |
| Backups Vercel/Supabase | Fora do app | Processo de purge sob pedido |
| Campos Art. 11 (sensíveis) | Coleta opcional no cadastro completo | Manter, minimizar ou restringir |
| Storage >1000 objetos/pasta | Paginação na exclusão (melhoria técnica desta rodada) | Validar em staging |

---

## 6. Marketing / Google Ads

- Consentimento: cookie `ri_cookie_consent=marketing` antes de carregar tags.  
- Decisão empresarial: manter Ads com opt-in **ou** desligar completamente.  
- Não declarar base legal aqui — cabe ao advogado.

---

## 7. Minimização e acesso

Recomendações técnicas (já alinhadas ao código; mudanças de produto exigem pedido explícito):

1. Evitar logs com corpo de request de pagamento/documentos.  
2. Sentry com scrubbing de e-mail/tokens/chaves (melhoria desta rodada).  
3. Empresa só acessa documentos após desbloqueio individual.  
4. Não expor secrets em `/api/payment/config` (já true).

---

## 8. O que esta rodada de código NÃO faz

- Não inventa nome/e-mail de DPO.  
- Não altera textos comerciais nem páginas de termos sem autorização jurídica.  
- Não assina DPAs.  
- Não declara o produto “em conformidade LGPD”.  
- Não muda Stripe LIVE, Asaas, planos ou banco de Production.
