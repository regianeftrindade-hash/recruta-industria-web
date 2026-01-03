# Integração PagSeguro - Guia de Configuração

## Status ✅ INTEGRADO

O sistema de pagamento profissional agora está **100% integrado com PagSeguro**.

## Configuração Atual

### 1. Variáveis de Ambiente (`.env.local`)

```env
PAGSEGURO_TOKEN=seu_token_pagseguro_aqui
PAGSEGURO_NOTIFICATION_URL=http://localhost:3000/api/pagseguro/webhook
```

### 2. Métodos de Pagamento Integrados

- ✅ **PIX** - Integrado com PagSeguro
- ✅ **Boleto** - Integrado com PagSeguro  
- ✅ **Cartão de Crédito** - Integrado com PagSeguro

## Próximos Passos para Ativar

### Passo 1: Criar Conta no PagSeguro
1. Acesse https://pagseguro.com
2. Crie uma conta de negócio
3. Faça login no painel

### Passo 2: Gerar Token de API
1. Vá para **"Integração"** ou **"API"**
2. Crie um novo token de autenticação
3. Copie o token

### Passo 3: Atualizar `.env.local`
```bash
PAGSEGURO_TOKEN=cole_seu_token_aqui
PAGSEGURO_NOTIFICATION_URL=https://seu-dominio.com/api/pagseguro/webhook
```

### Passo 4: Usar Sandbox Primeiro (Recomendado)
Para testes, use:
- URL: `https://sandbox.api.pagseguro.com`
- Token de teste do PagSeguro Sandbox

## URLs Integradas

### Frontend
- **Checkout**: `/professional/checkout`
- **Métodos**: PIX, Boleto, Cartão de Crédito

### Backend
- `POST /api/pagseguro/create-payment` - Criar pagamento
- `GET /api/pagseguro/status` - Verificar status
- `POST /api/pagseguro/webhook` - Notificações de pagamento
- `POST /api/auth/upgrade` - Registrar upgrade do usuário

## Fluxo de Pagamento

```
1. Usuário seleciona método (PIX/Boleto/Cartão)
   ↓
2. App envia dados para /api/pagseguro/create-payment
   ↓
3. PagSeguro processa e retorna dados de pagamento
   ↓
4. App salva registro em /api/auth/upgrade
   ↓
5. Usuário é redirecionado para página de sucesso
   ↓
6. Webhook confirma pagamento quando concluído
```

## Testes Recomendados

### Teste PIX (Sandbox)
```bash
curl -X POST http://localhost:3000/api/pagseguro/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1990,
    "method": "pix",
    "customer": {
      "name": "Teste",
      "email": "teste@example.com"
    }
  }'
```

### Teste Boleto (Sandbox)
```bash
curl -X POST http://localhost:3000/api/pagseguro/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1990,
    "method": "boleto",
    "customer": {
      "name": "Teste",
      "email": "teste@example.com"
    }
  }'
```

## Dados Armazenados

Cada transação armazena:
- `transactionId` - ID único da transação
- `pagseguroId` - ID do PagSeguro
- `paymentMethod` - Método escolhido
- `amount` - Valor em centavos (1990 = R$ 19,90)
- `status` - Status do pagamento
- `userEmail` - Email do usuário

## Arquivo Relacionado

[app/professional/checkout/page.tsx](app/professional/checkout/page.tsx) - Página de checkout integrada

---

**Última Atualização**: 02 de janeiro de 2026  
**Versão**: 1.0.0
