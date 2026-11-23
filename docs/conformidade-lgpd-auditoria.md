# Auditoria de conformidade e LGPD — Recruta Indústria

Data de referência: 23/11/2026 (America/Sao_Paulo). Escopo: código em `main` pós-PRs #57–#65 + sondagens read-only em produção. **Não é parecer jurídico.**

## Resumo executivo

A plataforma coleta dados pessoais extensos (incluindo categorias sensíveis no cadastro completo), opera com subprocessadores internacionais e já publica Termos de Uso / Privacidade com lacunas explícitas. Correções técnicas seguras desta rodada: consentimento de cookies + bloqueio do Google Ads sem opt-in; remoção de senha do `localStorage`; aceite de privacidade nos cadastros rápido/empresa; limpeza best-effort de arquivos no storage ao excluir conta.

---

## 1. Dados pessoais (mapa)

| Fonte | Dados | Finalidade | Base típica (a validar) |
|-------|--------|------------|-------------------------|
| Cadastro profissional simples | nome, e-mail, telefone, CPF (BR), senha, país | criar conta | execução de contrato / procedimentos preliminares |
| Cadastro profissional completo | contato, demografia, orientação sexual*, religião*, identidade de gênero*, antecedentes*, currículo, vídeo, certificados | perfil e recrutamento | contrato + **consentimento específico Art. 11** (pendente) |
| Cadastro empresa | razão social, responsável, e-mail, telefone, CNPJ/CPF (BR), endereço | conta empresa | contrato |
| Mensagens / propostas / chat | conteúdo + metadados | comunicação seletiva | contrato / legítimo interesse |
| Pagamentos | nome, e-mail, valor, referência; taxId enviado ao gateway | cobrança | contrato |
| Analytics 1º partido | path, referrer, sessionId | operação/segurança | legítimo interesse (validar) |
| Google Ads (3º) | cookies/identificadores de marketing | publicidade | **consentimento** (agora gated) |

\*Dados sensíveis (LGPD Art. 11) se preenchidos.

## 2. Cookies e rastreamento (testado)

| Tipo | Evidência | Consentimento |
|------|-----------|---------------|
| Essenciais (`next-auth.*`, `ri-locale`) | código | necessários |
| Marketing Google Ads (`AW-18447724143`) | `GoogleAdsLoader` (lazy, fora da home) | **antes:** sem banner; **agora:** só com `ri_cookie_consent=marketing` |
| Visitas 1º partido | `SiteVisitTracker` → `/api/analytics/visit` | sem banner (não injeta 3º partido) |
| Banner | produção pré-fix: **ausente** | corrigido no PR desta auditoria |

## 3. Subprocessadores (efetivos no código)

| Serviço | Dados típicos | Região | Pendência |
|---------|---------------|--------|-----------|
| Vercel | request logs, hosting | global (edge) | DPA / país de processamento |
| Supabase | Postgres + Storage (currículos, vídeos) | conforme projeto | confirmar região do projeto |
| Stripe | clientes intl, webhooks | EUA/global | DPA Stripe |
| Asaas | Pix/boleto BR, webhooks | Brasil | contrato/operador |
| Hostinger SMTP | e-mails transacionais | a confirmar | |
| Google OAuth / Ads | login / marketing | global | Ads só com consent |
| Upstash | rate-limit keys/IP | a confirmar | |
| Sentry | erros (se ativo) | a confirmar | |
| WhatsApp Cloud | off por padrão | Meta | |
| Datagma | ingestão parceira | a confirmar | |

**Não inventar certificações SOC2/ISO.** Listar contratos assinados é tarefa da empresa.

## 4. Segurança e retenção

| Tema | Status |
|------|--------|
| Exclusão de conta (self-service) | Existe |
| Limpeza de Storage na exclusão | **Melhorada** (best-effort) neste PR |
| `PaymentRecord` após exclusão | Pode permanecer (obrigação fiscal — validar prazo) |
| Retenção mensagens/propostas | 1 mês (`inbox-retention`) |
| Tabela de retenção por categoria | **Ausente** (jurídico) |
| Senha em `localStorage` | **Corrigido** |
| Rate-limit / bcrypt / signed URLs | Presentes |
| Upstash opcional | fallback memória em multi-instância = risco médio |

## 5. Termos — o que a empresa / advogado devem fornecer

1. Razão social, CNPJ, endereço da controladora  
2. Nome e contato do encarregado (DPO)  
3. Foro e lei aplicável  
4. Tabela de retenção por categoria de dado  
5. Lista oficial de subprocessadores + países  
6. Mecanismos de transferência internacional (cláusulas, etc.)  
7. Política de cookies detalhada (inventário)  
8. Revisão do texto pt-BR e traduções oficiais  
9. Bases legais Art. 11 para campos sensíveis (ou remoção/minimização)  
10. SLA / reembolso / aviso prévio (se forem compromissos contratuais)

## 6. Pagamentos

- Cartão completo **não** armazenado.  
- Stripe: assinatura, refund, cancel via webhook.  
- Asaas: BR; sandbox ≠ produção (`asaasSandbox: false` em prod).  
- Sem cobranças reais nesta auditoria.

## 7. Internacional / GDPR

- Operação multi-país + cookies marketing + subprocessadores fora do BR → avaliar GDPR/UK GDPR/LGPD cruzada com advogado.  
- **Não declarar conformidade GDPR** sem parecer especializado.

---

## Riscos classificados

### Crítico
| ID | Risco | Tipo |
|----|-------|------|
| C1 | Google Ads sem consentimento (pré-fix) | Técnico — **corrigido** |
| C2 | Dados sensíveis no perfil sem salvaguarda Art. 11 | Jurídico + produto |
| C3 | Senha em `localStorage` | Técnico — **corrigido** |

### Alto
| ID | Risco | Tipo |
|----|-------|------|
| A1 | Cadastros simples/empresa sem aceite formal (pré-fix) | Técnico — **corrigido** |
| A2 | Exclusão incompleta (storage/pagamentos) | Técnico parcial + jurídico |
| A3 | Termos sem identificação do controlador/DPO | Empresarial/jurídico |
| A4 | Transferências internacionais sem documentação | Empresarial/jurídico |

### Médio
| ID | Risco | Tipo |
|----|-------|------|
| M1 | Analytics 1º partido sem transparência detalhada | Jurídico (texto) |
| M2 | Rate-limit em memória sem Upstash | Técnico/ops |
| M3 | Compartilhamento de atestado/antecedentes com empresas | Produto/jurídico |
| M4 | Política de cookies ainda genérica | Jurídico |

### Baixo
| ID | Risco | Tipo |
|----|-------|------|
| B1 | Organization JSON-LD genérico | Já melhorado no #65 |
| B2 | Traduções do corpo dos termos ainda pt-BR | Conteúdo/jurídico |

---

## O que você precisa fornecer (lista objetiva)

1. Dados societários oficiais (razão social, CNPJ, endereço).  
2. Contato do DPO/encarregado.  
3. Preferência de foro/lei.  
4. Prazos de retenção desejados por tipo de dado.  
5. Confirmação da região do projeto Supabase e se há DPA.  
6. Lista de contratos com Vercel, Stripe, Asaas, Hostinger, Google, Upstash, Sentry.  
7. Decisão: manter ou remover campos sensíveis do cadastro.  
8. Textos finais dos Termos após revisão advocacia.  
9. Se Google Ads deve permanecer (opt-in) ou ser desligado.  
10. Política de retenção de `PaymentRecord` pós-exclusão de conta.
