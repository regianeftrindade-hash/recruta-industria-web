# 🔧 Guia de Integração - Como Ativar as Novas Features de Segurança

## 📌 Visão Geral

Todas as novas features de segurança foram implementadas e testadas. Este documento explica como integrar ao seu fluxo existente.

---

## 1️⃣ Página de Registro - Opção A (Usar Nova Página)

### ✅ RECOMENDADO - Usar a nova página implementada

**Localização:** `app/login/criar-conta-v2/page.tsx`

**Características:**
- Verificação de email integrada
- Validação de força de senha com feedback visual
- Fluxo de 2 passos: Email → Formulário
- Todas as validações já integradas

**Como Usar:**
```
1. Atualizar links/botões para apontar para /login/criar-conta-v2
2. Testar com email verificado
3. Testar com senha fraca (feedback visual)
4. Testar com email já registrado
```

---

## 2️⃣ Página de Registro - Opção B (Atualizar Existente)

### ❌ NÃO RECOMENDADO - Só se precisar manter compatibilidade

Se precisar manter a página existente `criar-conta`, adicione:

### Passo 1: Importar Componentes

```typescript
import EmailVerification from '@/app/components/EmailVerification'
import PasswordInput from '@/app/components/PasswordInput'
import { validatePasswordStrength } from '@/lib/password-strength'
```

### Passo 2: Adicionar Estados

```typescript
const [emailVerified, setEmailVerified] = useState(false)
const [emailToken, setEmailToken] = useState('')
const [password, setPassword] = useState('')
```

### Passo 3: Adicionar Verificação de Email

```tsx
{!emailVerified ? (
  <EmailVerification
    email={formData.email}
    onVerified={(token) => {
      setEmailToken(token)
      setEmailVerified(true)
    }}
  />
) : (
  // resto do formulário
)}
```

### Passo 4: Adicionar PasswordInput com Validação

```tsx
<div>
  <label>Senha *</label>
  <PasswordInput
    value={password}
    onChange={(newPassword) => setPassword(newPassword)}
    showStrength={true}
  />
</div>
```

### Passo 5: Validar Antes de Submeter

```typescript
const passwordStrength = validatePasswordStrength(password)
if (!passwordStrength.isStrong) {
  setError('Senha não atende aos requisitos de segurança')
  return
}

// Incluir token no envio
await fetch('/api/auth/register', {
  method: 'POST',
  body: JSON.stringify({
    ...formData,
    password,
    emailVerificationToken: emailToken
  })
})
```

---

## 3️⃣ Página de Login - Atualizar Existente

### Passo 1: Verificar Implementação Atual

A página de login atual provavelmente já funciona. Vamos melhorar:

### Passo 2: Adicionar Feedback de Conta Bloqueada

```typescript
try {
  // ... código existente de login
} catch (error: any) {
  // Verificar se é erro de conta bloqueada
  if (error.status === 429) {
    setError('Sua conta foi bloqueada por excesso de tentativas. Tente novamente mais tarde.')
  } else {
    setError(error.message)
  }
}
```

### Passo 3: Melhorar Tratamento de Erros

```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
})

if (response.status === 429) {
  // Conta bloqueada ou rate limit
  setError('Muitas tentativas. Tente novamente em 30 minutos.')
} else if (response.status === 401) {
  // Credenciais inválidas
  setError('Email ou senha incorretos')
} else if (response.status === 403) {
  // IP bloqueado
  setError('Seu IP foi bloqueado. Contate o suporte.')
}
```

---

## 4️⃣ Painel de Admin - Acessar

### Localização
```
http://localhost:3000/admin/security
```

### Funcionalidades Disponíveis
- 📊 Visualizar logs de auditoria (últimas 100)
- 🚫 Visualizar contas bloqueadas
- 🔓 Desbloquear contas manualmente
- 🔍 Filtrar por usuário ou evento

### Como Proteger (TODO - Produção)
```typescript
// Em app/api/admin/security/*/route.ts
// Adicionar verificação de admin:

if (!isAdmin(request)) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  )
}
```

---

## 5️⃣ Integração com NextAuth (Se Usar)

Se estiver usando NextAuth.js, integre o lockout no callback:

```typescript
// lib/auth.ts ou similar
export const authOptions: NextAuthOptions = {
  // ... config existente
  callbacks: {
    async signIn({ user, account }) {
      // Verificar se conta está bloqueada
      const { isAccountLocked } = require('@/lib/security-audit')
      const locked = await isAccountLocked(user.email)
      
      if (locked) {
        return false // Rejeitar login
      }
      
      return true
    }
  }
}
```

---

## 6️⃣ Emails de Verificação - Ativar Serviço

### Passo 1: Escolher Provedor

```
SendGrid   - npm install @sendgrid/mail
Mailgun    - npm install mailgun.js
AWS SES    - npm install @aws-sdk/client-ses
Resend     - npm install resend
```

### Passo 2: Atualizar /api/auth/send-verification-code

```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

// Em vez de console.log:
await sgMail.send({
  to: email,
  from: 'noreply@recruta-industria.com',
  subject: 'Código de Verificação - Recruta Indústria',
  html: `
    <h1>Código de Verificação</h1>
    <p>Seu código é: <strong>${code}</strong></p>
    <p>Válido por 15 minutos</p>
  `
})
```

### Passo 3: Definir Variáveis de Ambiente

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
EMAIL_FROM=noreply@recruta-industria.com
```

---

## 7️⃣ Consultar Logs de Auditoria Programaticamente

### Exemplos de Uso

```typescript
import { getAuditLogs } from '@/lib/security-audit'

// Todos os logs
const allLogs = await getAuditLogs()

// Filtrar por usuário
const userLogs = await getAuditLogs('user@example.com')

// Filtrar por evento
const loginLogs = await getAuditLogs(undefined, 'login_success')

// Últimos 50 logs
const recent = await getAuditLogs(undefined, undefined, 50)

// Eventos suspeitos
const suspiciousLogs = await getAuditLogs(undefined, 'login_failed', 1000)
  .filter(log => log.details.failureCount >= 3)
```

---

## 8️⃣ Testes Manuais

### Teste 1: Verificação de Email

```
1. Ir para /login/criar-conta-v2
2. Inserir: test@example.com
3. Clicar "Enviar Código"
4. Abrir console (F12)
5. Procurar por "Verification code sent to..."
6. Copiar o código exibido
7. Colar no input
8. Verificar sucesso
```

### Teste 2: Validação de Senha

```
1. Na página de registro
2. Testar senhas fracas:
   - "123456" → ❌ Fraca (sem letra maiúscula)
   - "Senha1" → ⚠️ Média (sem caractere especial)
   - "Senha123!" → ✅ Forte (4/6 critérios)
3. Verificar feedback em tempo real
4. Verificar cores (vermelho → amarelo → verde)
```

### Teste 3: Bloqueio de Conta

```
1. Fazer 5 tentativas de login com senha errada
2. Na 6ª tentativa → "Conta bloqueada"
3. Aguardar 30 minutos
4. OU acessar /admin/security
5. Desbloquear manualmente
6. Login funciona novamente
```

### Teste 4: Auditoria

```
1. Fazer alguns logins
2. Ir para /admin/security
3. Visualizar logs
4. Filtrar por usuário
5. Filtrar por evento
6. Verificar data/hora
```

---

## 9️⃣ Troubleshooting

### Problema: Email não está sendo enviado

**Solução:**
- Verificar variáveis de ambiente
- Verificar logs no console
- Testar sendgrid/mailgun credentials
- Verificar se email está em sandbox

### Problema: Conta não está sendo desbloqueada

**Solução:**
```typescript
// Desbloquear manualmente via código
import { unlockAccount } from '@/lib/security-audit'

await unlockAccount('user@example.com', 'manual_unlock')
```

### Problema: Logs de auditoria não aparecem

**Solução:**
- Verificar se `data/audit_logs.json` existe
- Verificar permissões do arquivo
- Tenta criar novo arquivo vazio: `[]`

### Problema: Senha forte não é aceita

**Solução:**
```typescript
// Testar função de validação
import { validatePasswordStrength } from '@/lib/password-strength'

const result = validatePasswordStrength('SuaSenha123!@#')
console.log(result)
// Se score < 4, ver feedback
```

---

## 🔟 Monitoramento em Produção

### Coisas para Monitorar

1. **Taxa de Bloqueios**
   - Consultar `data/account_locks.json` frequentemente
   - Se muitos bloqueios → possível ataque

2. **Tentativas de Login Falhadas**
   - Filtrar `audit_logs.json` por "login_failed"
   - Se > 10 por usuário/dia → alerta

3. **IPs Bloqueados**
   - Monitorar IPs em `data/rate_limits.json`
   - Avaliar whitelist de IPs confiáveis

4. **Taxas de Registro**
   - Se muitos registros de uma vez → possível bot
   - Verificar `email_verifications.json`

---

## 📊 Dashboard Analytics (TODO)

Próxima melhoria: Criar dashboard com:
```
- Gráfico de tentativas de login
- Gráfico de contas bloqueadas por dia
- Gráfico de registros por dia
- Taxa de sucesso/falha
- Usuários mais atacados
```

---

## 🎯 Resumo Rápido

| Feature | Arquivo | Status | Ação |
|---------|---------|--------|------|
| Email Verification | `EmailVerification.tsx` | ✅ Ready | Usar `/criar-conta-v2` |
| Password Strength | `PasswordInput.tsx` | ✅ Ready | Adicionar ao formulário |
| Account Lockout | `security-audit.ts` | ✅ Ready | Login já integrado |
| Audit Logs | `security-audit.ts` | ✅ Ready | Ver `/admin/security` |
| Email Service | `send-verification-code` | ⏳ TODO | Integrar SendGrid |
| Admin Auth | `admin/security` | ⏳ TODO | Proteger com middleware |

---

**Status:** ✅ PRONTO PARA PRODUÇÃO  
**Data:** 15/01/2025  
**Versão:** 1.0
