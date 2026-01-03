# 🔐 Segurança Avançada - Recruta Indústria

## Novas Implementações de Segurança (v2.0)

### 1. **CSRF Protection** (Cross-Site Request Forgery)
**Localização:** `lib/security.ts`

Protege contra ataques onde sites maliciosos tentam fazer requisições em nome do usuário.

```typescript
import { generateCSRFToken, validateCSRFToken } from '@/lib/security';

// Gerar token para sessão
const token = generateCSRFToken(sessionId);

// Validar token em formulários
const isValid = validateCSRFToken(sessionId, token);
```

**Características:**
- Tokens únicos por sessão
- Expiração em 1 hora
- Válido apenas para uma sessão

---

### 2. **Email Verification** (Verificação de Email)
**Localização:** `lib/security.ts`

Garante que o usuário possui acesso real ao email fornecido.

```typescript
import { 
  generateEmailVerificationToken,
  verifyEmailToken,
  isEmailVerified 
} from '@/lib/security';

// Gerar token de verificação
const token = generateEmailVerificationToken(email);
// Enviar email com link: /verify?token={token}&email={email}

// Verificar token
const verified = verifyEmailToken(email, token);

// Checar se email está verificado
if (isEmailVerified(email)) {
  // Permite acesso
}
```

**Características:**
- Token válido por 1 hora
- Precisa confirmar antes de usar conta
- Previne contas fake

---

### 3. **Two-Factor Authentication (2FA)**
**Localização:** `lib/security.ts`

Código de 6 dígitos enviado por email para segunda camada de autenticação.

```typescript
import { generate2FACode, validate2FACode } from '@/lib/security';

// Gerar código 2FA
const code = generate2FACode(email);
// Enviar por email/SMS: `Seu código de verificação: ${code}`

// Usuário entra o código
const isValid = validate2FACode(email, code);

if (isValid) {
  // Login permitido
} else {
  // Código inválido (máx 5 tentativas)
}
```

**Características:**
- Código de 6 dígitos aleatório
- Válido por 10 minutos
- Máximo 5 tentativas
- Bloqueia após exceder tentativas

---

### 4. **Encriptação de Dados Sensíveis**
**Localização:** `lib/security.ts`

Encripta dados antes de armazenar no banco de dados.

```typescript
import { 
  encryptSensitiveData,
  decryptSensitiveData 
} from '@/lib/security';

// Encriptar dados sensíveis (CPF, telefone, etc)
const cpfCriptografado = encryptSensitiveData(cpf);

// Descriptografar quando necessário
const cpfOriginal = decryptSensitiveData(cpfCriptografado);
```

**Usa:**
- AES-256-CBC encryption
- Chave derivada com scrypt
- IV aleatório para cada criptografia

**Dados para criptografar:**
- CPF
- Telefone
- Endereço completo
- Documentos

---

### 5. **Token Refresh** (Renovação Automática)
**Localização:** `lib/security.ts`

Tokens que expiram e são renovados automaticamente.

```typescript
import { 
  createSessionToken,
  refreshSessionToken,
  validateSessionToken 
} from '@/lib/security';

// Criar novo token de sessão
const token = createSessionToken(userId);
// token.accessToken (1 hora)
// token.refreshToken (7 dias)

// Renovar token quando expirar
const newToken = refreshSessionToken(userId, refreshToken);

// Validar token em cada requisição
if (validateSessionToken(userId, accessToken)) {
  // Acesso permitido
}
```

**Características:**
- Access token: 1 hora
- Refresh token: 7 dias
- Renovação automática
- Invalida tokens antigos

---

### 6. **IP Whitelist** (Lista de IPs Confiáveis)
**Localização:** `lib/security.ts`

Aprova automaticamente logins de IPs conhecidos.

```typescript
import { 
  addToIPWhitelist,
  isIPTrusted,
  trustIP,
  getTrustedIPs 
} from '@/lib/security';

// Adicionar IP após primeiro login
addToIPWhitelist(userIP, email);

// Verificar se IP é confiável
if (isIPTrusted(userIP, email)) {
  // Skip 2FA
}

// Usuário marca como "Confio neste dispositivo"
trustIP(userIP, email);

// Listar IPs confiáveis da conta
const trustedIPs = getTrustedIPs(email);
```

**Fluxo:**
1. Primeiro login: pede 2FA
2. Usuário marca "Confio neste dispositivo"
3. Próximos logins do mesmo IP: sem 2FA

---

### 7. **Detecção de Anomalias Avançada**
**Localização:** `lib/security.ts`

Detecta comportamento suspeito automaticamente.

```typescript
import { detectAnomaly, getAnomalyAlerts } from '@/lib/security';

// Verificar durante login
const { isAnomaly, reason } = detectAnomaly(email, ip, userAgent);

if (isAnomaly) {
  // Ativar verificação extra (2FA, email, etc)
  console.log(`Anomalia: ${reason}`);
}

// Ver alertas de anomalias
const alerts = getAnomalyAlerts(email);
```

**Detecta:**
- Múltiplos IPs em pouco tempo (>3)
- Múltiplos dispositivos (>3 user agents)
- Muitas tentativas de login (>10)

---

## 📋 Checklist de Segurança Completo

### Implementado ✅
- [x] Validação de email
- [x] Indicador de força de senha
- [x] Sanitização contra XSS
- [x] Validação de CNPJ/CPF
- [x] Rate limiting (brute force)
- [x] Middleware de autenticação
- [x] Google OAuth
- [x] **CSRF Protection** ← NOVO
- [x] **Email Verification** ← NOVO
- [x] **Two-Factor Authentication (2FA)** ← NOVO
- [x] **Encriptação de Dados Sensíveis** ← NOVO
- [x] **Token Refresh Automático** ← NOVO
- [x] **IP Whitelist** ← NOVO
- [x] **Detecção de Anomalias** ← NOVO

---

## 🚀 Como Usar em Formulários

### Exemplo Completo: Login Seguro

```typescript
'use client';
import { useState } from 'react';
import { 
  isValidEmail, 
  validatePasswordStrength,
  checkRateLimit,
  validate2FACode,
  generate2FACode,
  detectAnomaly,
  getClientIP,
  validateCSRFToken
} from '@/lib/security';

export default function LoginSeguro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code2FA, setCode2FA] = useState('');
  const [step, setStep] = useState<'email' | '2fa'>('email');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Passo 1: Validação básica
    if (!isValidEmail(email)) {
      alert('Email inválido');
      return;
    }
    
    const { isStrong } = validatePasswordStrength(password);
    if (!isStrong) {
      alert('Senha fraca');
      return;
    }
    
    // Passo 2: Rate limiting
    if (!checkRateLimit(email)) {
      alert('Muitas tentativas. Tente novamente em 15 minutos.');
      return;
    }
    
    // Passo 3: Detectar anomalias
    const clientIP = 'IP_DO_CLIENTE'; // Obter do servidor
    const userAgent = navigator.userAgent;
    const { isAnomaly, reason } = detectAnomaly(email, clientIP, userAgent);
    
    if (isAnomaly) {
      // Ativar 2FA obrigatório
      const code = generate2FACode(email);
      // Enviar email com código
      setStep('2fa');
      return;
    }
    
    // Passo 4: Login normal
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (data.requires2FA) {
        setStep('2fa');
      } else {
        // Login sucesso
        window.location.href = '/dashboard';
      }
    } catch (error) {
      alert('Erro no login');
    }
  };
  
  const handle2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate2FACode(email, code2FA)) {
      alert('Código inválido ou expirado');
      return;
    }
    
    // 2FA válido - completar login
    window.location.href = '/dashboard';
  };
  
  if (step === '2fa') {
    return (
      <form onSubmit={handle2FA}>
        <h2>Código de Verificação</h2>
        <input
          type="text"
          value={code2FA}
          onChange={(e) => setCode2FA(e.target.value)}
          placeholder="Digite o código de 6 dígitos"
          maxLength={6}
        />
        <button type="submit">Verificar</button>
      </form>
    );
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <h2>Login Seguro</h2>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## 🔧 Integração com API

### Middleware para Proteger Rotas

```typescript
// app/api/protected-route/route.ts
import { validateSessionToken } from '@/lib/security';

export async function POST(request: Request) {
  const { userId, accessToken } = await request.json();
  
  // Validar token
  if (!validateSessionToken(userId, accessToken)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Processar requisição
  return Response.json({ success: true });
}
```

---

## 📊 Resumo das Camadas de Segurança

| Camada | Função | Status |
|--------|--------|--------|
| **Frontend** | Email, senha, sanitização | ✅ Ativo |
| **CSRF** | Proteção de formulários | ✅ Ativo |
| **Email Verification** | Valida email real | ✅ Ativo |
| **2FA** | Segundo fator (código) | ✅ Ativo |
| **Encriptação** | Dados sensíveis em repouso | ✅ Ativo |
| **Rate Limiting** | Brute force (5 tentativas) | ✅ Ativo |
| **Token Refresh** | Expiração automática | ✅ Ativo |
| **IP Whitelist** | Aprova IPs conhecidos | ✅ Ativo |
| **Detecção de Anomalias** | Alerta comportamento suspeito | ✅ Ativo |

---

## 🚨 Segurança Crítica

**IMPORTANTE:** Todas as funções acima funcionam em memória. Para **produção**, migre para:
- CSRF tokens → banco de dados
- Email verification → banco de dados com expiração
- 2FA codes → cache (Redis)
- Session tokens → JWT + database
- IP whitelist → banco de dados

---

## 📞 Suporte

Para dúvidas sobre as novas implementações de segurança, consulte a equipe de desenvolvimento.

**Última atualização:** 2026-01-02
**Versão:** 2.0.0 - Advanced Security
