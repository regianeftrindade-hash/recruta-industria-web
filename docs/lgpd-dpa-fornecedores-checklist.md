# Checklist — DPAs / contratos com operadores

**Status:** checklist empresarial.  
**Não assina contratos.** Não declara existência de DPA assinado.  
**Validação jurídica obrigatória** antes de marcar qualquer item como “concluído”.

Relacionado: `docs/auditoria-fornecedores-lgpd.md`, `docs/lgpd-pendencias-operacionais.md`.

---

## Como usar

1. Controladora confirma se o fornecedor trata dados pessoais em nome do Recruta.  
2. Advogado classifica (operador / controlador conjunto / ferramenta sem tratamento relevante).  
3. Assinar DPA / addendum / cláusulas equivalentes **fora deste repositório**.  
4. Arquivar PDF assinado em repositório interno (não no git público).  
5. Registrar região de processamento e transferência internacional.

Legenda de status: `Pendente` | `Em revisão jurídica` | `Assinado (arquivar fora do git)` | `N/A (advogado)`.

---

## Fornecedores a avaliar

| Operador / serviço | Dados típicos | Região (confirmar) | DPA / equivalente | Transferência intl. | Status | Observação técnica no app |
|--------------------|---------------|--------------------|-------------------|---------------------|--------|---------------------------|
| Vercel | Logs, hosting, env | Confirmar conta | _a obter_ | Possível | Pendente | Runtime Next.js |
| Supabase / Postgres | Contas, perfis, vagas, pagamentos metadados | Confirmar projeto | _a obter_ | Confirmar | Pendente | `DATABASE_URL` |
| Asaas | Pagamentos BR, clientes BR | BR (confirmar) | _a obter_ | Geralmente BR | Pendente | Gateway BR |
| Stripe | Pagamentos intl., clientes | Confirmar | _a obter_ | Sim (EUA/UE etc.) | Pendente | LIVE intl.; não misturar com Asaas BR |
| Upstash Redis | IPs / chaves de rate-limit | Confirmar | _a obter_ | Possível | Pendente | Prefixo `ri-rl` |
| Sentry | Erros, stacks (com scrubbing) | Confirmar org | _a obter_ | Possível | Pendente | DSN opcional; `dataCollection` restritiva + scrub |
| Hostinger (e-mail/DNS) | E-mails transacionais / DNS | Confirmar | _a obter_ | Confirmar | Pendente | SPF/DMARC docs |
| Google Ads / tags | Identificadores marketing se consentido | Confirmar | _a obter_ | Sim | Pendente | Só com `ri_cookie_consent=marketing` |
| Emprega Campinas / fontes externas de vaga | Metadados de anúncio republicado | N/A anúncio público | Avaliar licença de republicação | — | Pendente jurídico/comercial | Importações admin; não é DPA clássico |

---

## O que o código NÃO faz

- Não cria PDFs de DPA.  
- Não simula assinatura.  
- Não marca fornecedor como “conforme” só porque há scrubbing técnico.  
- Não altera Production env / secrets nesta rodada.

## Próximo passo humano

Advogado + controladora: priorizar Vercel, banco (Supabase/Postgres), Asaas, Stripe e Sentry; depois Upstash/Google/Hostinger.
