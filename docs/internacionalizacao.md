# Internacionalização

O Recruta Indústria continua com o Brasil como mercado padrão: pt-BR, real (BRL) e fuso `America/Sao_Paulo`. O idioma da tela não muda país, documento, plano nem cobrança.

## Idiomas

pt-BR, en, es, fr, de, it, pt-PT, zh-CN, ja, ko, ar e hi. Árabe usa direção da direita para a esquerda. Um idioma ausente, inválido ou de conta antiga volta para pt-BR.

## Como o idioma é escolhido

1. Usuário autenticado: vale o idioma salvo na conta (`User.locale`).
2. Visitante: vale o cookie `ri-locale`.
3. Sem preferência ou valor fora da lista: pt-BR. A sessão de login não é derrubada por isso.

A exportação do perfil aceita `?idioma=` com um dos 12 códigos. Sem o parâmetro, usa o idioma da interface. O e-mail operacional usa o idioma da conta de quem recebe.

## Textos que não são traduzidos

Nomes, cidades, cargos, empresas e qualquer texto escrito pela pessoa permanecem como foram gravados. Opções de formulário mostram o rótulo traduzido, mas o valor salvo continua o texto original em português. A ordenação das cidades brasileiras segue o IBGE.

## Moeda, data e fuso

- Cobrança, planos, Asaas e PagBank permanecem em BRL. Não há conversão cambial.
- O salário de uma vaga pode ter a moeda daquela vaga. Se a moeda estiver ausente ou não for ISO, a tela usa BRL.
- Salário de proposta continua em reais.
- Datas da interface usam o idioma ativo. O instante não muda. O fuso padrão é `America/Sao_Paulo`.
- A data de publicação de vaga usa o dia civil em UTC para não mudar de dia por causa do fuso.

## Como acrescentar um idioma

1. Inclua o código em `SUPPORTED_LOCALES` e o nome nativo em `lib/i18n/locales.ts`.
2. Crie o catálogo com as mesmas chaves e os mesmos espaços `{nome}` do português.
3. Rode o teste `lib/i18n/__tests__/international.test.ts`. Ele compara as chaves dos 12 idiomas.
4. Não habilite cadastro nem documento desse país. País e idioma são independentes. Só o Brasil tem cadastro e pagamento.

Não crie um segundo sistema de tradução. Use `t(chave, idioma)` ou `exactUi(frase portuguesa exata)`.
