# 🔐 Guia Rápido de Segurança - Recruta Indústria

## Quick Start

### Importar Funções
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

---

## Funções de Validação

### 1. Email
```typescript
isValidEmail('user@example.com')  // true
isValidEmail('invalid-email')      // false
```

### 2. Força de Senha
```typescript
const result = validatePasswordStrength('MyPass123!');
// { isStrong: true, strength: 'strong', requirements: {...} }
```

**Requisitos (todos devem passar):**
- ✓ Min 8 caracteres
- ✓ Letra maiúscula (A-Z)
- ✓ Número (0-9)
- ✓ Símbolo (!@#$%^&*)

### 3. Sanitizar Entrada
```typescript
sanitizeInput('<img src=x onerror=alert(1)>')
// Resultado: "img src=x onerror=alert1"
```

### 4. CNPJ
```typescript
isValidCNPJ('11.222.333/0001-81')  // true
isValidCNPJ('11111111111111')       // false
```

### 5. CPF
```typescript
isValidCPF('123.456.789-00')  // true
isValidCPF('00000000000')       // false
```

### 6. Rate Limiting
```typescript
// Verificar tentativas
if (!checkRateLimit(email)) {
  return 'Muitas tentativas. Tente em 15 min.';
}

// Limpar contador
resetRateLimit(email);
```

---

## Exemplos de Integração

### Em um Formulário
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Email
  if (!isValidEmail(email)) {
    setError('Email inválido');
    return;
  }

  // Senha forte
  const { isStrong } = validatePasswordStrength(password);
  if (!isStrong) {
    setError('Senha fraca');
    return;
  }

  // Rate limit
  if (!checkRateLimit(email)) {
    setError('Muitas tentativas');
    return;
  }

  // OK! Proceder...
  registerUser(email, password);
};
```

---

## Onde as Funções Estão Usadas

| Função | Página | Status |
|--------|--------|--------|
| `isValidEmail()` | `/login/criar-conta` | ✅ Ativa |
| `validatePasswordStrength()` | `/login/criar-conta` | ✅ Ativa |
| `checkRateLimit()` | `/login` | ✅ Ativa |
| `isValidCNPJ()` | `/company/register` | ✅ Disponível |
| `isValidCPF()` | - | ✅ Disponível |
| `sanitizeInput()` | - | ✅ Disponível |

---

## Visualização do Indicador de Força

```
Vazio:    (nenhuma barra)
🔴 FRACA: ████░░░░  (1-2 requisitos)
🟠 MÉDIA: ████████░ (3 requisitos)
🟢 FORTE: ████████░ (4 requisitos)
```

---

## Mensagens de Erro

| Validação | Mensagem |
|-----------|----------|
| Email | "Por favor, use um email válido" |
| Senha | "Por favor, use uma senha mais forte" |
| Rate Limit | "Muitas tentativas. Tente novamente em 15 minutos." |
| CNPJ | "CNPJ inválido" |
| CPF | "CPF inválido" |

---

## API Reference

### `isValidEmail(email: string): boolean`
Retorna `true` se email é válido.

### `validatePasswordStrength(password: string)`
Retorna objeto com:
- `isStrong: boolean` (min 3 requisitos)
- `strength: 'weak' | 'medium' | 'strong'`
- `requirements: { minLength, hasUppercase, hasNumber, hasSymbol }`

### `sanitizeInput(input: string): string`
Remove caracteres perigosos e limita a 500 chars.

### `isValidCNPJ(cnpj: string): boolean`
Valida CNPJ com dígitos verificadores.

### `isValidCPF(cpf: string): boolean`
Valida CPF básico.

### `checkRateLimit(identifier: string, max?: number, window?: number): boolean`
- `identifier`: Email ou CPF/CNPJ do usuário
- `max`: Máximo de tentativas (padrão 5)
- `window`: Janela em ms (padrão 15 min)

### `resetRateLimit(identifier: string): void`
Limpa contador de tentativas.

---

## Exemplo Completo

```typescript
"use client";
import { useState } from 'react';
import { 
  isValidEmail, 
  validatePasswordStrength,
  checkRateLimit 
} from '@/lib/security';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validações
    if (!isValidEmail(email)) {
      newErrors.email = 'Email inválido';
    }

    const { isStrong } = validatePasswordStrength(password);
    if (!isStrong) {
      newErrors.password = 'Senha fraca';
    }

    if (!checkRateLimit(email)) {
      newErrors.submit = 'Muitas tentativas. Tente em 15 minutos.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Login OK
    console.log('Login autorizado para:', email);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {errors.password && <span>{errors.password}</span>}

      {errors.submit && <div>{errors.submit}</div>}

      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Troubleshooting

### Rate Limit Bloqueando?
```typescript
// Resetar manualmente (apenas desenvolvimento)
import { resetRateLimit } from '@/lib/security';
resetRateLimit('user@example.com');
```

### Validação Muito Rigorosa?
Ajustar limites em `lib/security.ts`:
- Email max: 254 → mude `email.length <= 254`
- Sanitize max: 500 → mude `.slice(0, 500)`
- Rate limit max: 5 → mude `maxAttempts = 5`

### Debug
```typescript
const result = validatePasswordStrength('test');
console.log(result);
// { isStrong: false, strength: 'weak', requirements: {...} }
```

---

## Recursos Adicionais

📖 Ver mais em:
- [SECURITY.md](./SECURITY.md) - Documentação completa
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Status de implementação
- [lib/security.ts](./lib/security.ts) - Código fonte

---

**Versão:** 1.0.0 | **Status:** ✅ PRONTO

