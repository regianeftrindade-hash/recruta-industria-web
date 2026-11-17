# Dependências e segurança — 16/11/2026

Prisma permanece 5.22.0. Next.js 16.4.6, NextAuth 4.24.15 e Sentry 10.78.0 continuam nas versões da rodada anterior.

| Pacote | Antes | Agora |
|---|---|---|
| nodemailer | 7.0.13 | 10.6.0 |
| pdfjs-dist | 5.6.205 | 6.2.108 |
| unpdf | 1.7.0 | 2.2.1 |
| vitest | 3.2.7 | 4.1.12 |

## E-mail

Nodemailer 10 exige Node 20 ou mais. `createTransport`, `sendMail` e `MailComposer` seguem iguais. O override `nodemailer@10.6.0` vale também para o NextAuth 4.24.15, o mailparser e o imapflow. `@types/nodemailer` saiu porque a versão 10 já inclui os tipos. O SMTP, o remetente e os anexos não mudaram. Nenhum e-mail real foi enviado.

## PDF

O unpdf 2.2.1 usa o PDF.js 6.2.108. A leitura de currículo continua. Essa versão do PDF.js não expõe mais `isEvalSupported`: a execução de script do documento saiu da API. O PDF.js 6 consulta `Iterator`, que o Node 20 não tem; `lib/curriculum/pdfjs-iterator-polyfill.ts` cobre isso. O Node 24 do projeto já tem a classe.

Há aviso ao carregar a fonte padrão Liberation Sans. Os testes de texto, de PDF gerado pelo site e de PDF com JavaScript passaram mesmo assim.

## Sentry

A linha 10, inclusive a 10.78.0, ainda puxa glob e minimatch no plugin de build. A correção oferecida pelo audit é `@sentry/nextjs` 11.13.0. Não mudei de linha. O aplicativo não usa `tunnelRoute`. O build usa Turbopack.

## Vitest

A falha crítica do tinypool era só da ferramenta de teste, não do servidor. O Vitest 4.1.12 fecha esse alerta. Os testes desta rodada passaram. O Vite avisa que `vitest.config.ts` está em CommonJS; isso não interrompe a execução.

## Audit

Produção: 0 críticas, 0 altas, 5 moderadas, todas no plugin de build do Sentry.

## Teste visual

Playwright e Cypress estão no projeto. Não foram executados, para não subir o app com o `.env.local`.
