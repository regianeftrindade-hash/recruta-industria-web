# Internacionalização

O Recruta Indústria continua com o Brasil como mercado padrão: pt-BR, real (BRL) e fuso `America/Sao_Paulo`. O idioma da tela não muda país, documento, plano nem cobrança.

## Idiomas

pt-BR, en, es, fr, de, it, pt-PT, zh-CN, ja, ko, ar e hi. Árabe usa direção da direita para a esquerda (`dir=rtl` no `<html>`). Um idioma ausente, inválido ou de conta antiga volta para pt-BR.

## Como o idioma é escolhido

1. Usuário autenticado: vale o idioma salvo na conta (`User.locale`).
2. Visitante: vale o cookie `ri-locale`.
3. Sem cookie/conta: tenta `Accept-Language` do navegador.
4. Sem preferência ou valor fora da lista: pt-BR. A sessão de login não é derrubada por isso.

O seletor de idioma (`LanguageSwitch`) grava cookie e, se houver sessão, atualiza a conta. A exportação do perfil aceita `?idioma=` com um dos 12 códigos. Sem o parâmetro, usa o idioma da interface. O e-mail operacional usa o idioma da conta de quem recebe.

## Textos que não são traduzidos

Nomes, cidades, cargos, empresas e qualquer texto escrito pela pessoa permanecem como foram gravados. Opções de formulário mostram o rótulo traduzido, mas o valor salvo continua o texto original em português. A ordenação das cidades brasileiras segue o IBGE.

## Cadastro internacional

Cadastro de profissional e empresa aceita países ISO. Fora do Brasil:

- CPF/CNPJ não são exigidos.
- Telefone deve vir em E.164 (começar com `+`).
- Locale/moeda/fuso padrão da conta seguem o mapa de região (`lib/identity/registration-region.ts`).

Verificação CNPJ e cobrança Asaas continuam regras brasileiras. Empresa internacional não usa o fluxo de cartão CNPJ.

## Moeda, data e fuso

- Datas e números da interface usam o idioma ativo (`formatUiDateTime` / `formatUiNumber`).
- Cobrança **Brasil**: Asaas (BRL). Requer `ASAAS_API_KEY`.
- Cobrança **internacional**: Stripe Checkout (USD / Adaptive Pricing) **somente** quando `STRIPE_SECRET_KEY` e Price IDs estão configurados; sem isso o checkout internacional fica indisponível. Não invente conversão cambial no app.
- O salário de uma vaga pode ter a moeda daquela vaga. Se a moeda estiver ausente ou não for ISO, a tela usa BRL.
- O fuso padrão operacional continua `America/Sao_Paulo` em vários painéis.

## SEO

URLs são as mesmas em todos os idiomas (cookie / Accept-Language). `hreflang` e `alternates.languages` apontam para o mesmo caminho — estratégia intencional, sem prefixo `/en/...`.

## Como acrescentar um idioma

1. Inclua o código em `SUPPORTED_LOCALES` e o nome nativo em `lib/i18n/locales.ts`.
2. Crie o catálogo com as mesmas chaves e os mesmos espaços `{nome}` do português.
3. Rode o teste `lib/i18n/__tests__/international.test.ts`. Ele compara as chaves dos 12 idiomas.

Não crie um segundo sistema de tradução. Use `t(chave, idioma)` ou `exactUi(frase portuguesa exata)`.

## Arquivos privados

Currículo, atestado, certificado, CNH e documento da empresa ficam fora das pastas públicas. A foto de perfil fica em `avatars` e pode ser exibida na busca.

A empresa só recebe o link do documento depois do desbloqueio individual daquele perfil. O link aponta para `/api/media/sign` e a autorização é conferida de novo a cada abertura. O plano Premium não dispensa esse desbloqueio. Sem desbloqueio ativo, a empresa não assina o arquivo de outra pessoa.

O upload feito antes de existir conta continua no fluxo de cadastro, com limite de quantidade. O arquivo fica no prefixo `anon` até ser associado ao perfil.
