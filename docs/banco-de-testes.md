# Banco de testes isolado

Os testes Vitest que gravam vaga, candidatura ou favorito não usam `DATABASE_URL` nem `DIRECT_URL`.

Sem um PostgreSQL local separado, esses três testes são pulados. O restante da suíte unitária continua.

## O que é recusado

A suíte para antes de conectar quando:

- `TEST_DATABASE_URL` ou `TEST_DIRECT_URL` é o mesmo banco de `DATABASE_URL` ou `DIRECT_URL`
- o destino não é PostgreSQL local (`127.0.0.1`, `localhost` ou equivalente)
- o nome do banco local não identifica um banco de teste, como `recruta_test`

Nenhuma dessas recusas abre conexão e nenhuma executa migration.

## Como preparar o banco local

Isto não cria o banco e não lê credencial de produção. No PostgreSQL da sua máquina:

```sql
CREATE DATABASE recruta_test;
```

No `.env.local`, que não entra no Git:

```bash
TEST_DATABASE_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/recruta_test
TEST_DIRECT_URL=postgresql://USUARIO:SENHA@127.0.0.1:5432/recruta_test
```

Use usuário e senha desse Postgres local. Não copie a URL da Vercel, do Supabase de produção nem de `DATABASE_URL`.

Quando esse banco existir, o schema de teste precisa ser aplicado nele com autorização explícita. Esta etapa não executa `prisma migrate`.

## Como rodar

```bash
npm test
```

- Sem `TEST_DATABASE_URL`: os testes de gravação aparecem como pulados.
- Com URL local isolada: eles usam só esse banco.
- Com URL da aplicação ou servidor remoto: a suíte falha e não conecta.

Os testes de navegador descritos em [e2e-secrets.md](./e2e-secrets.md) falam com o site publicado. Eles não passam pelo Prisma e não substituem este banco isolado.
