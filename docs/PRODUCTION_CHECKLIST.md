Production checklist — tokens, webhooks, DB migration

1) Revogar token exposto
- Vá ao painel do PagSeguro/PagBank e revogue o token imediatamente.
- Gere um novo token e atualize o arquivo `.env.local` local (não commitar):

```bash
# no seu ambiente local (não commite .env.local)
PAGSEGURO_TOKEN=<novo_token>
PAGSEGURO_API_URL=https://api.pagseguro.com
PAGSEGURO_WEBHOOK_SECRET=<secreto_webhook>
```

2) Registrar URL pública para webhooks
- No dashboard do PagSeguro/PagBank, adicione a URL pública do seu servidor:
  `https://<seu-domínio-ou-ngrok>.ngrok.io/api/pagseguro/webhook`
- Configure o `PAGSEGURO_WEBHOOK_SECRET` no painel e em `.env.local`.

3) Substituir store de arquivo por DB persistente (recomendado)
- Instale a dependência `better-sqlite3` (ou outro DB preferido):

```bash
npm install better-sqlite3
```

- O projeto já contém suporte opcional a SQLite em `lib/db.ts` e `lib/payments.ts`.
- Para migrar dados locais do arquivo para o DB:

```bash
node scripts/migrate_payments.js
```

- Para usar Postgres / outra DB em produção: implemente um adaptador (substitua `lib/payments.ts`), e aponte variáveis de ambiente para a DB.

4) Testes finais
- Reinicie o servidor e verifique endpoints:

```bash
npx tsc --noEmit
npm run dev
# (ou build + start em produção)
```

- Teste criação de pagamento e webhook recebida.
