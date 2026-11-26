# Auditoria final — Recruta Indústria (26/11/2026)

**Fuso:** America/Sao_Paulo.  
**Base:** `main` pós #85–#91.  
**Escopo desta entrega:** correções técnicas seguras (idade 18+ pela data real; gate empresa internacional).  
**Isto NÃO é parecer jurídico e NÃO declara conformidade LGPD.**

## O que estava errado

1. Cadastro completo podia avançar/salvar com menor de 18 se a idade digitável fosse alterada; o FE validava `idade`, não a data de nascimento.
2. Wizard/obrigatórios só checavam formato da data, não 18+.
3. Empresas internacionais verificadas eram bloqueadas por exigir CNPJ/CPF no gate de candidatos (regressão do #91 no detalhe/unlock).

## O que foi corrigido

- Validação FE/obrigatórios/wizard e submit usam `isProfessionalAgeAllowed` na **data de nascimento**.
- Campo idade no cadastro ficou somente leitura.
- Perfil incompleto exige 18+; perfil já completo só revalida se a data vier no payload.
- `companyCanSearchProfessionals` diferencia BR vs exterior.

## Pendências humanas / jurídicas

- DPO, CNPJ, endereço, DPAs, tabela de retenção, bases Art. 11, traduções oficiais dos termos (corpo ainda pt-BR com fallback).

## Pronto para operar?

Tecnicamente **sim, com ressalvas jurídicas** listadas acima. Sem merge/deploy nesta entrega — aguarda autorização.
