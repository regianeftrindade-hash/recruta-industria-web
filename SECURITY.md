# 🔐 Guia de Segurança - Recruta Indústria

## Implementações de Segurança

### 1. **Validação de Email**
- **Função:** `isValidEmail(email)`
- **Localização:** `lib/security.ts`
- **Uso:** Valida formato de email com regex e limita a 254 caracteres
- **Integrado em:** `/login/criar-conta` (página de registro)

```typescript
import { isValidEmail } from '@/lib/security';

if (!isValidEmail(formData.email)) {
  alert('Por favor, use um email válido');
  return;
}
```

### 2. **Validação de Força de Senha**
- **Função:** `validatePasswordStrength(password)`
- **Localização:** `lib/security.ts`
- **Retorna:** `{ isStrong, strength, requirements }`
- **Requisitos verificados:**
  - ✓ Mínimo 8 caracteres
  - ✓ Letra maiúscula
  - ✓ Número
  - ✓ Símbolo (!@#$%^&*(),.?":{}|<>)
- **Integrado em:** `/login/criar-conta` (com indicador visual em tempo real)

```typescript
const result = validatePasswordStrength(password);
// Retorna: { 
//   isStrong: true,
//   strength: 'strong',
//   requirements: {
//     minLength: true,
//     hasUppercase: true,
//     hasNumber: true,
//     hasSymbol: true
//   }
// }
```

### 3. **Proteção contra XSS (Cross-Site Scripting)**
- **Função:** `sanitizeInput(input)`
- **Localização:** `lib/security.ts`
- **Proteção:**
  - Remove caracteres `<` e `>`
  - Remove padrão `javascript:`
  - Limita entrada a 500 caracteres
- **Uso recomendado:** Todas as entradas de usuário antes de armazenar

```typescript
import { sanitizeInput } from '@/lib/security';

const safeInput = sanitizeInput(userInput);
```

### 4. **Validação de CNPJ**
- **Função:** `isValidCNPJ(cnpj)`
- **Localização:** `lib/security.ts`
- **Algoritmo:** Validação com dígitos verificadores
- **Integrado em:** `/company/register` (validação de registro)

```typescript
import { isValidCNPJ } from '@/lib/security';

if (!isValidCNPJ(cnpj)) {
  alert('CNPJ inválido');
  return;
}
```

### 5. **Validação de CPF**
- **Função:** `isValidCPF(cpf)`
- **Localização:** `lib/security.ts`
- **Validação:** Comprimento e padrão básico

```typescript
import { isValidCPF } from '@/lib/security';

if (!isValidCPF(cpf)) {
  alert('CPF inválido');
  return;
}
```

### 6. **Rate Limiting (Proteção contra Brute Force)**
- **Funções:**
  - `checkRateLimit(identifier, maxAttempts=5, windowMs=15min)`
  - `resetRateLimit(identifier)`
- **Localização:** `lib/security.ts`
- **Comportamento:** Bloqueia após 5 tentativas em 15 minutos
- **Integrado em:** `/login` (validação de tentativas de login)

```typescript
import { checkRateLimit, resetRateLimit } from '@/lib/security';

// Verificar se está dentro do limite
if (!checkRateLimit(userEmail)) {
  setErrorMessage('Muitas tentativas de login. Tente novamente em 15 minutos.');
  return;
}

// Limpar tentativas após login bem-sucedido
resetRateLimit(userEmail);
```

---

## 🔒 Proteção de Rotas

### Middleware de Autenticação
- **Arquivo:** `middleware.ts`
- **Rotas Protegidas:**
  - `/professional/dashboard` - Dashboard de profissional
  - `/company/dashboard-empresa` - Dashboard de empresa
  - `/company/company/profile/*` - Perfil de empresa

**Comportamento:** Redireciona usuários não autenticados para `/login` com parâmetro de redirecionamento

```typescript
// middleware.ts
if (isProtectedRoute && !session) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('redirect', pathname);
  return NextResponse.redirect(url);
}
```

---

## 🔑 Autenticação com Google (NextAuth.js)

### Configuração
- **Arquivo:** `app/api/auth/[...nextauth]/route.ts`
- **Provider:** Google OAuth 2.0
- **Variáveis de Ambiente:**
  - `NEXTAUTH_URL=http://localhost:3000`
  - `NEXTAUTH_SECRET=recruta-industria-secret-key-2025-prod`
  - `GOOGLE_CLIENT_ID=383086307966-li0lkml4nv6pq6lojm5ce09q9811sii3`
  - `GOOGLE_CLIENT_SECRET=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`

### Fluxo de Login
1. Usuário clica "Login com Google"
2. Redireciona para `/api/auth/signin/google`
3. Google autentica o usuário
4. NextAuth cria sessão com JWT token
5. Usuário é redirecionado para o dashboard apropriado

---

## 📋 Checklist de Segurança

### Implementado ✅
- [x] Validação de email
- [x] Indicador de força de senha com 4 requisitos
- [x] Sanitização de entrada contra XSS
- [x] Validação de CNPJ/CPF
- [x] Rate limiting para login (5 tentativas/15 min)
- [x] Middleware de autenticação para rotas protegidas
- [x] Autenticação com Google OAuth
- [x] Cookies seguros com NextAuth

### Recomendado para Futuro 📝
- [ ] CSRF tokens em formulários
- [ ] Hash de senha (bcrypt) no backend
- [ ] Autenticação two-factor (2FA)
- [ ] Logs de atividade de segurança
- [ ] Alertas de tentativas de invasão
- [ ] Verificação de email
- [ ] Renovação automática de tokens
- [ ] Encriptação de dados sensíveis em repouso

---

## 🚀 Como Usar

### Importar Funções de Segurança
```typescript
import { 
  isValidEmail,
  validatePasswordStrength,
  sanitizeInput,
  isValidCNPJ,
  isValidCPF,
  checkRateLimit,
  resetRateLimit
} from '@/lib/security';
```

### Validação em Formulário
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Validar email
  if (!isValidEmail(formData.email)) {
    setError('Email inválido');
    return;
  }

  // Validar força de senha
  const { isStrong } = validatePasswordStrength(formData.senha);
  if (!isStrong) {
    setError('Senha fraca');
    return;
  }

  // Sanitizar entrada
  const cleanEmail = sanitizeInput(formData.email);

  // Verificar rate limit no login
  if (!checkRateLimit(cleanEmail)) {
    setError('Muitas tentativas. Tente novamente em 15 minutos.');
    return;
  }

  // Prosseguir com login
  // ...
};
```

---

## 📊 Estatísticas de Segurança

| Camada | Status | Descrição |
|--------|--------|-----------|
| **Frontend Validation** | ✅ Ativo | Email, senha, CNPJ, CPF |
| **Input Sanitization** | ✅ Ativo | Proteção contra XSS |
| **Rate Limiting** | ✅ Ativo | 5 tentativas/15 min |
| **Route Protection** | ✅ Ativo | Middleware NextAuth |
| **OAuth Integration** | ✅ Ativo | Google + NextAuth |
| **Password Strength** | ✅ Ativo | 4 requisitos |

---

## 📞 Suporte

Para dúvidas sobre segurança ou relatar vulnerabilidades, entre em contato com a equipe de desenvolvimento.

**Última atualização:** 2025-01-01
**Versão de Segurança:** 1.0.0
