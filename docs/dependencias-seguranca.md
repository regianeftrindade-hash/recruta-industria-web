# Dependências e segurança — 26/11/2026

Prisma permanece 5.22.0. Next.js 16.4.6, NextAuth 4.24.15. **Sentry `@sentry/nextjs` 11.19.0** (upgrade controlado nesta rodada).

| Pacote | Antes | Agora |
|---|---|---|
| @sentry/nextjs | 10.78.0 | **11.19.0** |
| nodemailer | 7.0.13 | 10.6.0 |
| pdfjs-dist | 5.6.205 | 6.2.108 |
| unpdf | 1.7.0 | 2.2.1 |
| vitest | 3.2.7 | 4.1.12 |

## Sentry 11 (controlado)

- `sendDefaultPii` removido no SDK → `dataCollection` explícita **restritiva** em `lib/observability/sentry-options.ts` (equivalente ao v10 com PII off).
- Scrubbing adicional mantido em `beforeSend` (`sentry-privacy.ts`).
- Projeto **não** usa `withSentryConfig` / `tunnelRoute` no `next.config.js` — superfície de breaking menor.
- Replays: sessão 0; erro 0.1 (cliente).
- Requer Node ≥20.19 (CI/Vercel: alinhar com `engines`).

## E-mail / PDF / Vitest

Sem mudança nesta rodada (ver histórico anterior). Nodemailer 10 + unpdf 2 / PDF.js 6 permanecem.

## Audit

Após upgrade Sentry 11.19.0: `npm audit` → **0 vulnerabilities** (nesta máquina, 26/11/2026).

## Teste

Unitários de `sentry-options` / `sentry-privacy` / SEO hreflang. Build/typecheck/lint na rodada de qualidade.
