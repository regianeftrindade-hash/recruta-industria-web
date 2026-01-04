# 🔐 Guia de Segurança - Environment Variables & Secrets

## ⚠️ Situação Atual

❌ **PROBLEMA**: Arquivo `.env.local` com secrets sensíveis está **visível no repositório**

```
GOOGLE_CLIENT_SECRET=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  ❌ EXPOSTO!
NEXTAUTH_SECRET=recruta-industria-segredo-local-123456    ❌ EXPOSTO!
```

---

## ✅ Solução Implementada

### 1️⃣ **Atualizar `.gitignore`** ✅

```gitignore
# Proteger todos os arquivos .env
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# Proteger banco de dados local
prisma/dev.db
prisma/dev.db-journal

# Proteger dados JSON
data/users.json
data/payments.json
data/contacts.json
```

### 2️⃣ **Criar `.env.example`** ✅

Arquivo de template com variáveis vazias:
```env
NEXTAUTH_SECRET=seu-secret-super-seguro-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
DATABASE_URL="file:./prisma/dev.db"
```

---

## 🚨 Ações Imediatas Necessárias

### 1. Regenerar Google Credentials

⚠️ O Google Secret atual pode estar comprometido:

**Passo 1**: Ir para [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**Passo 2**: Deletar credencial atual
- Selecione o OAuth 2.0 Client ID
- Clique em "Delete"

**Passo 3**: Criar novo OAuth 2.0 Client
- Tipo: Web application
- Authorized JavaScript origins:
  - `http://localhost:3000` (desenvolvimento)
  - `https://yourdomain.com` (produção)
- Authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://yourdomain.com/api/auth/callback/google`

**Passo 4**: Copiar novo Client ID e Secret

### 2. Regenerar NEXTAUTH_SECRET

```bash
# No terminal, gere um novo secret:
openssl rand -base64 32
```

### 3. Atualizar `.env.local`

```bash
# 1. Remove arquivo atual
rm .env.local

# 2. Copia do exemplo
cp .env.example .env.local

# 3. Edita com valores reais
code .env.local
```

### 4. Verificar Git

```bash
# Ver se .env.local está rastreado
git status

# Se estiver, remover do histórico
git rm --cached .env.local
git add .gitignore
git commit -m "Remove .env.local from git history"
```

---

## 📋 Variáveis por Ambiente

### 🏠 Local (Desenvolvimento)

```env
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
```

### 🌐 Produção (Vercel)

```env
NEXTAUTH_URL=https://seu-dominio.com
NODE_ENV=production
DATABASE_URL="postgresql://user:password@host/db"
```

---

## 🔑 Como Usar Secrets em Produção

### **Vercel** (Recomendado)

```bash
# Adicionar secret
vercel env add GOOGLE_CLIENT_SECRET

# Verificar secrets
vercel env list

# Usar em CI/CD
vercel deploy
```

### **AWS Lambda**

Usar AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name recruta-industria/google-secret \
  --secret-string '{"GOOGLE_CLIENT_SECRET":"..."}'
```

### **Docker/Docker Compose**

```yaml
services:
  web:
    environment:
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
```

---

## ✅ Checklist de Segurança

- [ ] `.gitignore` contém `.env.local`
- [ ] `.env.local` **não** está no git
- [ ] Google Secret foi **regenerado**
- [ ] NEXTAUTH_SECRET foi **regenerado**
- [ ] `.env.example` contém template (sem valores sensíveis)
- [ ] Produção usa Vercel/AWS para secrets
- [ ] Database URL é diferente entre dev/prod
- [ ] Nenhum secret em commits anteriores

---

## 🔄 Git History Cleanup (Se necessário)

Se você já fez commit com `.env.local`:

```bash
# Ver todos os commits com .env.local
git log --all --full-history -- .env.local

# Remove de TODO o histórico
git filter-branch --tree-filter 'rm -f .env.local' -- --all

# Force push (⚠️ apenas se repo é privado)
git push origin master --force-with-lease
```

---

## 📚 Referências

- [NextAuth.js - Environment Variables](https://next-auth.js.org/getting-started/example)
- [Google OAuth - Security Best Practices](https://developers.google.com/identity/protocols/oauth2/openid-connect)
- [Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Status**: 🟢 **Segurança Melhorada**
**Próximo**: Implementar em produção via Vercel
