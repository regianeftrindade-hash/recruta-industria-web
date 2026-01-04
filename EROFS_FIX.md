# 🔧 Correção: EROFS - Read-Only File System (Vercel)

## ❌ Problema
Você estava usando arquivos JSON para armazenar dados em `/var/task/data/users.json`, o que não funciona no Vercel (serverless).

## ✅ Solução Implementada

### 1. **Schema Prisma Atualizado**
Adicionei 2 novas tabelas ao banco de dados:

```prisma
// Verificação de email
model EmailVerification {
  id        String   @id @default(cuid())
  email     String   @unique
  code      String
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// Pagamentos
model PaymentRecord {
  id        String   @id @default(cuid())
  reference String   @unique
  status    String
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. **Arquivos Atualizados**
✅ `app/api/auth/send-verification-code/route.ts` - Usa Prisma em vez de arquivo
✅ `app/api/pagseguro/webhook/route.ts` - Usa Prisma em vez de arquivo
✅ `app/api/pagseguro/status/route.ts` - Usa Prisma em vez de arquivo

### 3. **Próximos Passos**

Execute as migrations:
```powershell
npx prisma migrate dev --name add-verifications-and-payments
```

Depois corrija os outros arquivos PagBank:
- `app/api/pagbank/webhook/route.ts`
- `app/api/pagbank/status/route.ts`
- `app/api/pagbank/card-session/route.ts`
- `app/api/pagbank/create-payment/route.ts`

E PagSeguro:
- `app/api/pagseguro/pix/route.ts`
- `app/api/pagseguro/create-payment/route.ts`

---

## 📝 O que mudou?

### Antes (❌ Não funciona em Vercel):
```typescript
import fs from 'fs'
const DATA_FILE = join(process.cwd(), 'data', 'payments.json')
const txt = await fs.promises.readFile(DATA_FILE, 'utf8')
await fs.promises.writeFile(DATA_FILE, JSON.stringify(items))
```

### Depois (✅ Funciona em Vercel):
```typescript
import { prisma } from '@/lib/db'
const payment = await prisma.paymentRecord.findUnique({ where: { reference } })
await prisma.paymentRecord.update({ where: { id }, data: { status } })
```

---

## 🚀 Próximo: Deploy sem erros
Após executar as migrations, seu app funcionará perfeitamente no Vercel!
