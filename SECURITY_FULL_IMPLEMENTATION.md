# 🔐 Guia de Segurança - Recruta Indústria

## Visão Geral das Camadas de Segurança

O sistema implementa 4 camadas de segurança abrangentes para proteger contas de usuários e dados da plataforma:

### 1️⃣ Verificação de Email (Email Verification)

**Arquivo:** `app/api/auth/send-verification-code/route.ts`  
**Componente:** `app/components/EmailVerification.tsx`

#### Características:
- ✅ Código de 6 dígitos gerado aleatoriamente
- ✅ Validade de 15 minutos para o código
- ✅ Rate limiting: máximo 1 envio por minuto por email
- ✅ Interface com campo de entrada e botão de reenvio com cooldown

#### Fluxo:
```
1. Usuário insere email no formulário
2. Clica "Enviar código de verificação"
3. Código é gerado e armazenado em data/email_verifications.json
4. Em desenvolvimento: código é exibido no console
5. Usuário insere o código de 6 dígitos
6. Sistema valida e emite verification token
7. Token é necessário para completar o registro
```

#### Integração:
```typescript
// Em app/login/criar-conta-v2/page.tsx
import EmailVerification from '@/app/components/EmailVerification'

<EmailVerification
  email={email}
  onVerified={(token) => {
    // Token pronto para usar no registro
  }}
/>
```

#### TODO: Email Service Integration
Atualmente, o código é exibido no console. Para produção, integre:
- **SendGrid** - `npm install @sendgrid/mail`
- **Mailgun** - `npm install mailgun.js`
- **AWS SES** - `npm install @aws-sdk/client-ses`
- **Resend** - `npm install resend`

---

### 2️⃣ Validação de Força de Senha (Password Strength)

**Arquivo:** `lib/password-strength.ts`  
**Componente:** `app/components/PasswordInput.tsx`

#### Requisitos:
Senha deve atender **no mínimo 4 dos 6 critérios:**

```
✓ Mínimo 8 caracteres
✓ Mínimo 12 caracteres (bonus)
✓ Contém letra MAIÚSCULA
✓ Contém letra minúscula
✓ Contém números (0-9)
✓ Contém caracteres especiais (!@#$%^&*)

✗ NÃO contém padrões comuns (123456, password, qwerty, etc)
```

#### Scoring:
- **Score < 2:** ❌ Fraca (RED)
- **Score 2-3:** ⚠️ Média (YELLOW)
- **Score 3:** ✓ Boa (GREEN)
- **Score 4:** ✅ Forte (DARK GREEN)

#### Uso:
```typescript
import { validatePasswordStrength } from '@/lib/password-strength'

const strength = validatePasswordStrength('MinhaSenha123!@#')
console.log(strength)
// {
//   score: 4,
//   feedback: ['✓ Tem 8+ caracteres', '✓ Tem letra maiúscula', ...],
//   isStrong: true
// }
```

#### Componente com Feedback Visual:
```tsx
<PasswordInput
  value={password}
  onChange={(newPassword) => setPassword(newPassword)}
  showStrength={true}  // Mostra barra de força em tempo real
/>
```

---

### 3️⃣ Bloqueio de Conta (Account Lockout)

**Arquivo:** `lib/security-audit.ts`  
**Função:** `lockAccount()`, `isAccountLocked()`

#### Características:
- ✅ Bloqueio automático após **5 tentativas falhadas**
- ✅ Desbloqueio automático após **30 minutos**
- ✅ Desbloqueio manual por admin
- ✅ Histórico de bloqueios

#### Fluxo:
```
1. Usuário insere senha incorreta
2. Função lockAccount() incrementa tentativas
3. Após 5 falhas → Conta bloqueada
4. Próximas tentativas são rejeitadas
5. Depois de 30 min → Desbloqueio automático
```

#### API:
```typescript
// Bloquear conta após falhas
await lockAccount('user@example.com', 'Failed login attempt')

// Verificar se está bloqueada
const isLocked = await isAccountLocked('user@example.com')
if (isLocked) {
  // Rejeitar login
}

// Desbloquear manualmente (admin)
await unlockAccount('user@example.com', 'admin')
```

#### Dados Armazenados:
Arquivo: `data/account_locks.json`
```json
[
  {
    "email": "user@example.com",
    "reason": "Failed login attempt",
    "attemptCount": 5,
    "lockedAt": "2025-01-15T10:30:00Z",
    "unlockedAt": "2025-01-15T11:00:00Z"
  }
]
```

---

### 4️⃣ Auditoria de Segurança (Security Audit Logs)

**Arquivo:** `lib/security-audit.ts`  
**Funções:** `logAudit()`, `getAuditLogs()`

#### Eventos Registrados:
- ✅ Tentativas de login (sucesso/falha)
- ✅ Registros de usuário
- ✅ Alterações de senha
- ✅ Bloqueios de conta
- ✅ Desbloqueios de conta
- ✅ Verificações de email
- ✅ Tentativas de ataque (IP bloqueado, rate limit, etc)

#### Dados Registrados:
```typescript
await logAudit('event_type', 'user_id', 'action', {
  ip: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date().toISOString(),
  details: { ... }
})
```

#### Exemplos:
```typescript
// Login bem-sucedido
await logAudit('login_success', 'user@example.com', 'successful_login', {
  ip: '192.168.1.1'
})

// Registro de usuario
await logAudit('registration_success', 'newuser@example.com', 'account_created', {
  userType: 'professional'
})

// Detecção de ataque
await logAudit('brute_force_detected', 'attacker@ip.com', 'attack_blocked', {
  attemptCount: 5,
  timeWindow: '15min'
})
```

#### Arquivo de Dados:
Arquivo: `data/audit_logs.json`
```json
[
  {
    "id": "uuid-123",
    "event": "login_success",
    "userId": "user@example.com",
    "action": "successful_login",
    "timestamp": "2025-01-15T10:30:00Z",
    "details": { "ip": "192.168.1.1" }
  }
]
```

#### Consultar Logs:
```typescript
import { getAuditLogs } from '@/lib/security-audit'

// Todos os logs
const allLogs = await getAuditLogs()

// Filtrar por usuário
const userLogs = await getAuditLogs('user@example.com')

// Filtrar por tipo de evento
const loginLogs = await getAuditLogs(undefined, 'login_success')

// Limitar resultados
const recent = await getAuditLogs(undefined, undefined, 100)
```

---

## 📊 Painel de Administração

**Localização:** `/admin/security`

### Recursos:
- ✅ Visualização de logs de auditoria em tempo real
- ✅ Listagem de contas bloqueadas
- ✅ Desbloqueio manual de contas
- ✅ Filtros por usuário/evento
- ✅ Atualização automática a cada 30 segundos

### Endpoints:
```
GET  /api/admin/security/audit-logs      # Lista logs com filtros
GET  /api/admin/security/account-locks   # Lista contas bloqueadas
POST /api/admin/security/unlock-account  # Desbloqueia conta
```

### Screenshot:
```
┌─────────────────────────────────────────┐
│ 🔐 Painel de Segurança                  │
├─────────────────────────────────────────┤
│ [📊 Logs de Auditoria] [🚫 Contas...]  │
├─────────────────────────────────────────┤
│ Data       │ Evento  │ Usuário │ Ação  │
│ 10:30      │ login   │ user... │ fail  │
│ 10:25      │ register│ user... │ success
└─────────────────────────────────────────┘
```

---

## 🔄 Fluxo Integrado de Segurança

### Registro:
```
1. Usuário clica em "Criar Conta"
   ↓
2. Inserir EMAIL
   ↓
3. VERIFICAR EMAIL (6-digit code)
   ↓
4. PREENCHER FORMULÁRIO
   - Tipo de usuário
   - Nome/CNPJ/CPF
   - SENHA (validação de força)
   - Confirmar senha
   ↓
5. VALIDAR FORÇA DE SENHA
   - Score < 4? Rejeitar com feedback
   ↓
6. ENVIAR PARA /api/auth/register
   - Verificar email já registrado
   - Hash da senha
   - Log de auditoria
   ↓
7. ✅ CONTA CRIADA
```

### Login:
```
1. Usuário clica em "Fazer Login"
   ↓
2. Inserir EMAIL E SENHA
   ↓
3. VERIFICAR IP (bloqueado?)
   ↓
4. RATE LIMIT (5 tentativas em 15 min?)
   ↓
5. VERIFICAR CONTA BLOQUEADA
   - Se bloqueado > 30 min atrás: Desbloquear automaticamente
   - Se bloqueado < 30 min atrás: Rejeitar
   ↓
6. VERIFICAR CREDENCIAIS
   - Email existe?
   - Senha correta?
   ↓
7. SE FALHAR
   - lockAccount() incrementa tentativas
   - Log de auditoria
   ↓
8. SE SUCESSO
   - Desbloquear conta (limpar falhas)
   - Atualizar lastLogin
   - Log de auditoria
   ↓
9. ✅ LOGIN REALIZADO
```

---

## 🛡️ Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────┐
│                   CLIENTE (Frontend)                │
│  - PasswordInput (feedback visual)                  │
│  - EmailVerification (6-digit)                      │
│  - Formulários validados                           │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS
                    ↓
┌─────────────────────────────────────────────────────┐
│              APIS (Backend - Next.js)               │
│  - /api/auth/register                              │
│  - /api/auth/login                                 │
│  - /api/auth/send-verification-code                │
│  - /api/auth/verify-email                          │
│  - /api/admin/security/*                           │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    ┌──────┐    ┌──────┐   ┌────────┐
    │Security│  │Password│  │Security│
    │Audit  │  │Strength│  │Check   │
    └──────┘    └──────┘   └────────┘
        │           │           │
        └───────────┼───────────┘
                    ↓
    ┌───────────────────────────────┐
    │    JSON Files (Persistence)   │
    │  - users.json                 │
    │  - audit_logs.json            │
    │  - account_locks.json         │
    │  - email_verifications.json   │
    └───────────────────────────────┘
```

---

## 📋 Implementação Checklist

- ✅ Email verification com 6-digit codes
- ✅ Password strength validator com feedback visual
- ✅ Account lockout com desbloqueio automático
- ✅ Audit logging completo
- ✅ Admin dashboard com visualização
- ✅ API de desbloqueio manual
- ⏳ Email service integration (SendGrid/Mailgun)
- ⏳ IP geolocation blocking (próximo)
- ⏳ Device fingerprinting (próximo)
- ⏳ Backup & recovery system (próximo)

---

## 🚀 Próximas Melhorias

### 1. Email Service Integration
Integrar com SendGrid/Mailgun para enviar código realmente para o email do usuário em produção.

### 2. CORS & CSP Headers
Adicionar headers de segurança mais restritivos:
```typescript
'X-Frame-Options': 'DENY'
'X-Content-Type-Options': 'nosniff'
'Strict-Transport-Security': 'max-age=31536000'
'Content-Security-Policy': "default-src 'self'"
```

### 3. Device Fingerprinting
Detectar e bloquear múltiplos logins de locais diferentes simultaneamente.

### 4. Backup & Recovery
Sistema de backup automático de dados críticos com possibilidade de recuperação.

### 5. 2FA (Two-Factor Authentication)
Integrar autenticação de dois fatores com Google Authenticator/SMS.

---

## 📞 Suporte

Para questões sobre a implementação de segurança, consulte:
- `lib/security-audit.ts` - Funções principais
- `lib/password-strength.ts` - Validação de senha
- `app/api/auth/` - Endpoints de autenticação
- `/admin/security` - Painel de administração

---

**Status:** ✅ Implementação Completa  
**Data:** 15/01/2025  
**Versão:** 1.0
