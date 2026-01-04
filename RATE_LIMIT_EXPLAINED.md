# 🔒 Rate Limiting - Explicação e Solução

## ❌ Problema: "Acesso bloqueado temporariamente"

Você recebeu a mensagem:
```
❌ Acesso bloqueado temporariamente. 
Você fez muitas tentativas de login. 
Por favor, aguarde 15 minutos antes de tentar novamente.
```

---

## 🔍 O Que Significa?

O sistema implementou **proteção contra brute force** (força bruta):

- **5 tentativas falhadas** = Bloqueio automático
- **15 minutos** = Tempo de espera antes de poder tentar novamente
- **Por IP** = Bloqueio é baseado no seu endereço de IP

---

## ✅ Como Resolver

### Opção 1: Aguardar 15 Minutos (Mais Fácil) ⏰

```
1. Espere 15 minutos
2. Após 15 minutos, tente fazer login novamente
3. O sistema automaticamente desbloqueará seu IP
4. ✅ Você poderá fazer login normalmente
```

### Opção 2: Resetar o Rate Limit (Administrador) 🔑

Se você é administrador do sistema:

```bash
# Abra um terminal e execute:
cd c:\Projetos\recruta-industria\recruta-industria-web

# Resetar para seu IP (exemplo)
node scripts/reset-rate-limit.js 192.168.1.100

# Ou para um email específico
node scripts/reset-rate-limit.js seu-email@example.com
```

**Resultado:**
```
✅ Rate limit foi resetado para: seu-ip-ou-email
Você já pode tentar fazer login novamente!
```

### Opção 3: Usar Endpoint de Admin (API)

```bash
curl -X POST http://localhost:3000/api/admin/reset-rate-limit \
  -H "Content-Type: application/json" \
  -d '{"ip":"seu-ip-aqui"}'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Rate limit resetado para IP: seu-ip",
  "ip": "seu-ip"
}
```

---

## 📊 Como o Rate Limiting Funciona

### Fluxo de Bloqueio:

```
Tentativa 1: ❌ Senha errada
            ↓
Tentativa 2: ❌ Senha errada  
            ↓
Tentativa 3: ❌ Senha errada
            ↓
Tentativa 4: ❌ Senha errada
            ↓
Tentativa 5: ❌ Senha errada
            ↓
IP BLOQUEADO POR 15 MINUTOS ❌
            ↓
(Após 15 minutos)
            ↓
Contador reseta 🔄
            ↓
Pode tentar novamente ✅
```

---

## 🛡️ Por Que Existe?

O rate limiting protege contra:

1. **Brute Force** - Ataque onde alguém tenta muitas senhas
2. **Força Bruta** - Tentativa de adivinhar a senha
3. **Ataque Automatizado** - Bot tentando invadir contas

### Exemplo de Ataque Bloqueado:

```
Hacker faz 100 tentativas de login em 1 minuto
Sistema detecta: Muitas tentativas!
Sistema bloqueia: IP do hacker por 15 minutos
Hacker não consegue fazer mais tentativas
✅ Conta de usuário está segura
```

---

## 📝 Configurações do Rate Limit

| Aspecto | Valor |
|--------|-------|
| **Máximo de tentativas** | 5 |
| **Janela de tempo** | 15 minutos |
| **Baseado em** | IP (endereço de rede) |
| **Resets após** | 15 minutos de inatividade |

---

## ❓ Perguntas Frequentes

### P: Posso contornar o rate limit?
**R:** Não. É uma proteção de segurança do servidor. Você precisará aguardar 15 minutos ou um administrador pode resetar manualmente.

### P: Por que sou bloqueado mesmo com a senha correta?
**R:** Se você digitou a senha errada 5 vezes antes de digitar corretamente, estará bloqueado. O contador não diferencia senhas erradas de certas.

### P: Meu amigo está acessando do mesmo IP, está bloqueado também?
**R:** Sim. O bloqueio é por **IP**, não por email. Todos que usam o mesmo IP serão afetados.

### P: Como faço login de um lugar diferente?
**R:** Se você usar um IP diferente (outro WiFi, 4G, etc), poderá fazer login normalmente. O bloqueio é específico do IP anterior.

### P: Quanto tempo dura o bloqueio?
**R:** Exatamente **15 minutos**. Depois você pode tentar novamente.

### P: Como faço para resetar antes de 15 minutos?
**R:** Contate um administrador do sistema. Ele pode usar o comando:
```bash
node scripts/reset-rate-limit.js seu-ip
```

---

## 🔧 Para Administradores

### Resetar Rate Limit via Script

**Arquivo:** `scripts/reset-rate-limit.js`

```bash
# Sintaxe
node scripts/reset-rate-limit.js <IP-OU-EMAIL>

# Exemplos
node scripts/reset-rate-limit.js 192.168.1.100
node scripts/reset-rate-limit.js usuario@example.com
```

### Resetar via API

**Endpoint:** `POST /api/admin/reset-rate-limit`

```typescript
const response = await fetch('/api/admin/reset-rate-limit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ip: '192.168.1.100' })
})

const data = await response.json()
console.log(data)
// { success: true, message: "Rate limit resetado...", ip: "192.168.1.100" }
```

### Verificar Rate Limits em Memória

O rate limit é armazenado em **memória do servidor**:

```typescript
// Arquivo: lib/security.ts
const loginAttempts = new Map<string, { count: number; timestamp: number }>()

// Exemplos:
// loginAttempts.get('192.168.1.100') → { count: 5, timestamp: 1234567890 }
// loginAttempts.get('user@email.com') → { count: 3, timestamp: 1234567890 }
```

---

## 💾 Armazenamento

O rate limit é armazenado em **memória RAM** do servidor:

✅ **Vantagens:**
- Muito rápido
- Sem necessidade de banco de dados

❌ **Desvantagens:**
- Reseta quando servidor reinicia
- Não persiste entre restarts

### Se Reiniciar o Servidor:

```
Servidor reinicia
    ↓
Memória é limpa
    ↓
Rate limits são resetados automaticamente
    ↓
Todos os IPs bloqueados são desbloqueados
```

---

## 🚀 Melhorias Futuras

Possíveis melhorias ao sistema:

1. **Redis** - Armazenar rate limit em Redis (persistente)
2. **Banco de Dados** - Salvar em banco de dados
3. **Email Alert** - Avisar quando IP é bloqueado
4. **Dashboard** - Ver IPs bloqueados em tempo real
5. **Whitelist** - Exceções para IPs confiáveis

---

## 📞 Suporte

Se o problema persistir:

1. **Verifique seu IP**: `curl https://icanhazip.com`
2. **Aguarde 15 minutos** e tente novamente
3. **Contate um administrador** para resetar manualmente
4. **Verifique a senha**: Certifique-se de digitar corretamente

---

**Status:** ✅ SISTEMA FUNCIONAL  
**Proteção:** ✅ ATIVA  
**Data:** 03 de janeiro de 2026
