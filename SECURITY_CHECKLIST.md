# 🔐 CHECKLIST DE SEGURANÇA - RECRUTA INDÚSTRIA

> Status: **2026-01-04** | Versão: **1.0**

---

## 📋 SEGURANÇA DE VARIÁVEIS DE AMBIENTE

### ✅ Secrets & Environment Variables

- [ ] **NEXTAUTH_SECRET**
  - [ ] Valor único e criptográfico (>= 32 caracteres)
  - [ ] NÃO hardcoded no código
  - [ ] Regenerado: `openssl rand -base64 32`
  - [ ] Em `.env.local` (não em git)
  - [ ] Valor atual: _______________

- [ ] **GOOGLE_CLIENT_SECRET**
  - [ ] Obtido em Google Cloud Console
  - [ ] NÃO exposto em repositório
  - [ ] Regenerado recentemente: SIM ☐ NÃO ☐
  - [ ] Em `.env.local` (não em git)
  - [ ] Matches com GOOGLE_CLIENT_ID

- [ ] **GOOGLE_CLIENT_ID**
  - [ ] Válido e ativo no Google Console
  - [ ] Matches com SECRET correspondente
  - [ ] Authorized redirect URIs configuradas:
    - [ ] `http://localhost:3000/api/auth/callback/google`
    - [ ] `https://yourdomain.com/api/auth/callback/google`
  - [ ] Authorized JavaScript origins:
    - [ ] `http://localhost:3000`
    - [ ] `https://yourdomain.com`

- [ ] **DATABASE_URL**
  - [ ] Não expõe credenciais em logs
  - [ ] Password complexa (>= 12 caracteres)
  - [ ] Em `.env.local`
  - [ ] Diferente entre dev/staging/prod

- [ ] **Outras variáveis sensíveis**
  - [ ] PAGBANK_TOKEN não exposto
  - [ ] PAGBANK_WEBHOOK_SECRET protegido
  - [ ] Nenhum secret em logs

---

## 🛡️ GIT & REPOSITÓRIO

### ✅ Proteção de Arquivos Sensíveis

- [ ] **`.gitignore` atualizado**
  - [ ] Contém `.env.local`
  - [ ] Contém `.env.*.local`
  - [ ] Contém `prisma/dev.db`
  - [ ] Contém `data/*.json`
  - [ ] Contém `node_modules/`

- [ ] **`.env.local` NÃO está em git**
  ```bash
  # Verificar:
  git status | grep ".env.local"
  # Resultado esperado: Nada ou "Untracked"
  ```

- [ ] **Nenhum secret em commits anteriores**
  ```bash
  # Procurar por secrets:
  git log --all --full-history -p | grep -i "GOOGLE_CLIENT_SECRET"
  # Resultado esperado: Nada
  ```

- [ ] **Histórico Git limpo** (se necessário)
  - [ ] Executado `cleanup-git-history.ps1` ou `.sh`
  - [ ] `git push --force-with-lease` feito
  - [ ] Colab notificados sobre rebase

### ✅ Configuração Git

- [ ] **Git user configurado**
  ```bash
  git config user.name "Seu Nome"
  git config user.email "seu@email.com"
  ```

- [ ] **SSH key ou token GitHub**
  - [ ] Configurado para autenticação
  - [ ] NÃO é a mesma de outro projeto
  - [ ] Rotação planejada: _______________

- [ ] **Branch protection rules** (se GitHub/GitLab)
  - [ ] `main` branch protegido
  - [ ] Requer pull requests
  - [ ] Requer aprovação
  - [ ] Checks passam antes de merge

---

## 🔑 NEXTAUTH CONFIGURATION

### ✅ Provider Configuration

- [ ] **GoogleProvider** configurado corretamente
  ```typescript
  // Verificar em src/app/api/auth/[...nextauth]/route.ts
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // ❌ Nunca hardcode secrets
  })
  ```

- [ ] **CredentialsProvider** implementado
  - [ ] Verifica password com hash
  - [ ] NÃO retorna senha em sessão
  - [ ] Rate limiting implementado

- [ ] **Callbacks** seguros
  - [ ] `jwt` callback sanitiza dados
  - [ ] `session` callback não expõe sensíveis
  - [ ] `redirect` previne open redirects

### ✅ Session Security

- [ ] **Session token seguro**
  - [ ] Usa JWT ou seguro equivalente
  - [ ] Expira em tempo razoável (24h recomendado)
  - [ ] HttpOnly cookies (se cookies)
  - [ ] Secure flag (HTTPS apenas)
  - [ ] SameSite=Strict

- [ ] **CSRF protection**
  - [ ] NextAuth fornece automaticamente
  - [ ] Tokens validados em mutações

---

## 🗄️ DATABASE SECURITY

### ✅ Prisma & SQLite/PostgreSQL

- [ ] **Connection string segura**
  - [ ] Em `.env.local`
  - [ ] Não em logs
  - [ ] Password complexa
  - [ ] Diferentes credenciais dev/prod

- [ ] **Prisma migrations**
  - [ ] Todas as migrations executadas
  - [ ] Schema.prisma review realizado
  - [ ] Sem campos `@password` sem hash
  - [ ] Sem dados hardcoded sensíveis

- [ ] **Database backups**
  - [ ] Backup automático configurado (prod)
  - [ ] Teste de restore realizado
  - [ ] Backups criptografados

- [ ] **SQL Injection prevention**
  - [ ] Usando Prisma (não SQL raw)
  - [ ] Inputs validados
  - [ ] Nenhum concatenation de SQL

### ✅ Data Protection

- [ ] **Sensitive fields criptografados**
  - [ ] Passwords: ✅ Hashed (bcrypt/argon2)
  - [ ] CPF/CNPJ: Verificar se precisa encrypt
  - [ ] Email: Pode ser plain (usado para login)

- [ ] **Data retention policy**
  - [ ] Define quanto tempo manter dados
  - [ ] LGPD compliance (Brasil)
  - [ ] Delete/anonymization implementado

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### ✅ Password Security

- [ ] **Password hashing**
  - [ ] Usa bcrypt ou argon2 (NÃO MD5/SHA1)
  - [ ] Salt factor >= 10
  - [ ] Verificado em `lib/security.ts`

- [ ] **Password strength validation**
  - [ ] Mínimo 8 caracteres
  - [ ] Requer números, letras, símbolos
  - [ ] Check contra common passwords
  - [ ] Implementado em `lib/password-strength.ts`

- [ ] **Password reset**
  - [ ] Token de reset tem expiração
  - [ ] Link one-time use
  - [ ] Email de confirmação

### ✅ Rate Limiting

- [ ] **Login attempts limitados**
  - [ ] Max 5 tentativas por IP / 15 min
  - [ ] IP blocking após múltiplas falhas
  - [ ] Implementado em `lib/security.ts`

- [ ] **API rate limiting**
  - [ ] `/api/auth/register` rate limited
  - [ ] `/api/auth/login` rate limited
  - [ ] Headers enviados: `Retry-After`

### ✅ Account Lockout

- [ ] **Proteção contra brute force**
  - [ ] Conta bloqueia após N falhas
  - [ ] Desbloqueio automático ou manual
  - [ ] Admin pode desbloquear
  - [ ] Logs de tentativas armazenados

---

## 🚨 API SECURITY

### ✅ Endpoint Protection

- [ ] **Autenticação obrigatória**
  - [ ] GET `/api/user/profile` requer auth
  - [ ] POST `/api/user/update` requer auth
  - [ ] DELETE `/api/user` requer auth
  - [ ] Sem auth públicos (login, register, etc)

- [ ] **Authorization checks**
  ```typescript
  // ✅ Correto:
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  // ❌ Errado:
  const user = await prisma.user.findUnique({
    where: { id: req.body.userId } // Sem validar!
  })
  ```

- [ ] **Input validation**
  - [ ] Email validado com regex seguro
  - [ ] CPF validado (algorithm check)
  - [ ] Comprimento máximo enforçado
  - [ ] XSS prevention (sanitize inputs)

- [ ] **Output encoding**
  - [ ] JSON responses safe
  - [ ] Nenhum `eval()` ou `Function()`
  - [ ] Template rendering safe

### ✅ CORS & Headers

- [ ] **CORS configurado**
  ```typescript
  // Apenas domínios confiáveis
  cors: {
    origin: ["https://yourdomain.com"],
    credentials: true
  }
  ```

- [ ] **Security headers**
  - [ ] `Content-Security-Policy` configurada
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `Strict-Transport-Security` (HTTPS)

---

## 📊 LOGGING & MONITORING

### ✅ Security Audit Logs

- [ ] **Login/Register eventos logados**
  - [ ] User, timestamp, IP, result
  - [ ] Armazenados em banco seguro
  - [ ] Arquivo: `lib/security-audit.ts`

- [ ] **Logs não contêm secrets**
  ```typescript
  // ❌ Errado:
  console.log(`Login: ${email} / ${password}`)
  
  // ✅ Correto:
  console.log(`Login attempt for ${email}`)
  ```

- [ ] **Acesso a logs restrito**
  - [ ] Apenas admin pode ver
  - [ ] Audit trail imutável
  - [ ] Retenção de 90 dias (recomendado)

### ✅ Error Handling

- [ ] **Erros não expõem informações**
  - [ ] Stack traces não enviados ao client
  - [ ] Mensagens genéricas ("Invalid credentials")
  - [ ] Detalhes apenas em logs

- [ ] **HTTPS enforcement**
  - [ ] Redirect HTTP → HTTPS
  - [ ] Todos endpoints HTTPS
  - [ ] Certificate válido e atualizado

---

## 🌐 DEPLOYMENT & INFRA

### ✅ Production Environment

- [ ] **NODE_ENV=production**
  - [ ] Em Vercel/host
  - [ ] NÃO em desenvolvimento local

- [ ] **Secrets em plataforma segura**
  - [ ] Vercel: Environment variables
  - [ ] AWS: Secrets Manager
  - [ ] NÃO em `.env.local` na produção

- [ ] **Database em produção**
  - [ ] PostgreSQL (NÃO SQLite)
  - [ ] Backups automáticos
  - [ ] Encryption at rest

- [ ] **HTTPS/TLS**
  - [ ] Certificate válido
  - [ ] Renewal automático
  - [ ] TLS 1.2+ apenas

### ✅ Build Security

- [ ] **Build sem secrets**
  ```bash
  # ✅ Vercel injeta via env vars
  npm run build
  
  # ❌ Nunca build com .env.local commitado
  ```

- [ ] **Dependencies checadas**
  ```bash
  npm audit
  npm audit fix
  ```

- [ ] **SCA (Software Composition Analysis)**
  - [ ] Dependências monitoradas
  - [ ] Vulnerabilities report
  - [ ] Update policy definida

---

## 📱 PWA & Service Worker

### ✅ Security Considerations

- [ ] **Service Worker protegido**
  - [ ] HTTPS only
  - [ ] Caching policy seguro
  - [ ] NÃO cacheia dados sensíveis

- [ ] **Offline mode**
  - [ ] Sem acesso a dados de usuário offline
  - [ ] Sincronização segura ao voltar online

---

## 🧪 TESTING & VALIDATION

### ✅ Security Tests

- [ ] **Testes de autenticação**
  ```bash
  npm run test:auth
  # - Login com credenciais erradas
  # - Rate limiting funciona
  # - Sessions expiram
  ```

- [ ] **Testes de autorização**
  - [ ] User não acessa dados de outro
  - [ ] Admin tem permissões extras
  - [ ] Guest não acessa routes privadas

- [ ] **Testes de input validation**
  - [ ] SQL injection blocked
  - [ ] XSS blocked
  - [ ] CSRF blocked

---

## ☑️ PRÉ-DEPLOYMENT CHECKLIST

Execute ANTES de fazer deploy para produção:

```bash
# 1. Verificar secrets
echo "NEXTAUTH_SECRET length:"
echo ${#NEXTAUTH_SECRET}  # Deve ser >= 32

# 2. Verificar git
git status                 # Nada não-staged
git log --oneline | head  # Commits limpos

# 3. Rodar linter
npm run lint

# 4. Rodar tests
npm test

# 5. Build
npm run build

# 6. Verificar .env
cat .env.example > /tmp/env.check
# Verificar que .env.local está em gitignore

# 7. Audit de dependências
npm audit
```

---

## 🚀 DEPLOYMENT VERIFICAÇÃO

Após deploy, verificar:

- [ ] HTTPS funcionando
  ```bash
  curl -I https://yourdomain.com
  ```

- [ ] Secrets carregados corretamente
  - [ ] Google login funciona
  - [ ] Database conecta
  - [ ] Nenhum erro de "undefined variable"

- [ ] Logs não contêm secrets
  ```bash
  tail -f /var/log/app.log | grep -i secret
  # Resultado esperado: Nada
  ```

- [ ] Security headers presentes
  ```bash
  curl -I https://yourdomain.com | grep -i "strict-transport"
  ```

---

## 📞 INCIDENT RESPONSE

Se descobrir que um secret foi exposto:

### ✅ Passo 1: Revoke (Imediato)
```bash
# Regenerar secret exposto
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Atualizar em produção
vercel env add NEXTAUTH_SECRET "$NEXTAUTH_SECRET"
```

### ✅ Passo 2: Notify (ASAP)
- [ ] Notifique security team
- [ ] Se Google secret: regenerar no Console
- [ ] Se database: mudar password

### ✅ Passo 3: Investigate
- [ ] Quando foi exposto?
- [ ] Quem teve acesso?
- [ ] Qual foi o impacto?
- [ ] Documentar em relatório

### ✅ Passo 4: Prevent
- [ ] Melhorar `.gitignore`
- [ ] Adicionar pre-commit hooks
- [ ] Treinar team

---

## 📈 CONTINUOUS SECURITY

- [ ] **Semanal**: `npm audit` check
- [ ] **Mensal**: Security review
- [ ] **Trimestral**: Penetration test
- [ ] **Anual**: Full security audit

---

## ✅ RESUMO RÁPIDO

| Item | Status | Último Check |
|------|--------|--------------|
| Secrets protegidos | ☐ | ____________ |
| Git limpo | ☐ | ____________ |
| `.gitignore` correto | ☐ | ____________ |
| NextAuth seguro | ☐ | ____________ |
| Database seguro | ☐ | ____________ |
| API endpoints protegidos | ☐ | ____________ |
| Logging seguro | ☐ | ____________ |
| HTTPS ativo | ☐ | ____________ |
| Dependências auditadas | ☐ | ____________ |
| Pre-deployment OK | ☐ | ____________ |

---

**Última Atualização**: 2026-01-04
**Próximo Review**: 2026-01-11
**Responsável**: _______________
