# Auditoria final — Recruta Indústria (26/11/2026)

**Fuso:** America/Sao_Paulo.  
**Base:** `main` pós #85–#91 (+ esta entrega).  
**Escopo desta entrega:** correções técnicas seguras (idade 18+ pela data real; gate empresa internacional).  
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

## Débitos conhecidos (não bloqueiam merge desta PR; não “melhorados” à força)

**i18n (pós-cadastro / pagamento):** boas-vindas profissional, páginas `/pagamento`, checkout/upgrade literais, botão “Entrar com Google”, corpos jurídicos de cadastro e `/termos` (fallback pt-BR). Home/login/cadastros/vagas críticos já usam `t()`.

**Auth / ops:** `allowDangerousEmailAccountLinking` no Google; rate-limit de login em memória sem Upstash frágil em multi-instância; rota legada `/api/auth/login` fora da UI; anti-replay de reset de senha com Set em processo.

**LGPD / humano:** DPO, CNPJ/endereço, DPAs, tabela de retenção, bases Art. 11, anonimização eventual de `PaymentRecord.customer` após exclusão.

## Pronto para operar?

Tecnicamente **sim, com ressalvas jurídicas e débitos i18n não críticos** acima. Sem merge/deploy nesta entrega — aguarda autorização.
