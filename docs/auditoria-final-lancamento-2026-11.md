# Auditoria final — Recruta Indústria (26/11/2026)

**Fuso:** America/Sao_Paulo.  
**Base:** `main` pós #85–#91 (+ esta entrega).  
**Escopo desta entrega:** correções técnicas seguras (idade 18+ pela data real; gate empresa internacional) **+ fechamento i18n** (seletor em PT, pagamentos/boas-vindas/Google nos 12 idiomas, estrutura jurídica sem tradução oficial inventada).  
**Isto NÃO é parecer jurídico e NÃO declara conformidade LGPD.**

## O que estava errado (corrigido no código)

1. Cadastro completo podia avançar/salvar com menor de 18 se a idade digitável fosse alterada; o FE validava `idade`, não a data de nascimento.
2. Wizard/obrigatórios só checavam formato da data, não 18+.
3. Empresas internacionais verificadas eram bloqueadas por exigir CNPJ/CPF no gate de candidatos (regressão do #91 no detalhe/unlock).

## O que foi corrigido

- Validação FE/obrigatórios/wizard e submit usam `isProfessionalAgeAllowed` na **data de nascimento**.
- Campo idade no cadastro ficou somente leitura.
- Perfil incompleto exige 18+; perfil já completo só revalida se a data vier no payload.
- `companyCanSearchProfessionals` diferencia BR vs exterior.

## Já adequado (auditoria de confirmação)

| Área | Estado |
|------|--------|
| 12 idiomas + RTL `ar` | Implementados (`locales.ts`, layout `dir`, CSS, e2e) |
| Seletor + cookie `ri-locale` + conta/JWT | Persistência coerente |
| hreflang / sitemap / robots | Presentes (estratégia “mesma URL” documentada) |
| Google Ads | Condicionado a cookie marketing |
| Unlock + verificação + mídia | Modelo sólido (pós-#91/#92) |
| Stripe LIVE / Asaas BR | Roteamento por país coerente; webhooks presentes |
| Exclusão de conta | Existe; PaymentRecord retido de propósito |

## i18n — fechado nesta entrega

| Item | Estado |
|------|--------|
| Seletor de idiomas | Rótulos em português (`LOCALE_SELECTOR_LABELS_PT`: Inglês, Espanhol, Francês, Árabe…) |
| Boas-vindas pro/empresa | `welcome.*` via `t()` + `fillMessage` nos 12 idiomas |
| Pagamentos / checkout / upgrade | Status, CTAs e erros via `pay.*` / `ui.*` nos 12 idiomas |
| Google Sign-In | `auth.googleSignIn` |
| Catálogos es…hi | Chaves `completion` mescladas |
| Termos jurídicos | Estrutura multi-idioma pronta (`legal-locale-status.ts`); **corpo oficial só pt-BR** até revisão jurídica — avisos `legal.officialTranslationPending` / `legal.structureReadyNotice` (sem inventar tradução legal) |

## Débitos restantes (fora de código / humano)

**Auth / ops:** `allowDangerousEmailAccountLinking` no Google; rate-limit de login em memória sem Upstash em multi-instância; rota legada `/api/auth/login` fora da UI; anti-replay de reset de senha com Set em processo.

**LGPD / humano:** DPO, CNPJ/endereço, DPAs, tabela de retenção, bases Art. 11, anonimização eventual de `PaymentRecord.customer` após exclusão; tradução jurídica oficial dos 11 idiomas restantes.

## Pronto para operar?

Tecnicamente **sim, com ressalvas jurídicas** (DPO/DPAs/traduções legais oficiais). Sem merge/deploy nesta entrega — aguarda autorização.
