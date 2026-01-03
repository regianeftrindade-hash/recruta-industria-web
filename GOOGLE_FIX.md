# ⚠️ ERRO NO LOGIN COM GOOGLE - COMO CORRIGIR

## O Problema
O login está retornando `error=google`, o que significa que as credenciais do Google não estão corretas ou a URI de redirecionamento não está configurada.

## ✅ SOLUÇÃO - Siga estes passos:

### 1. Acesse o Google Cloud Console
https://console.cloud.google.com/apis/credentials

### 2. Clique nas suas credenciais OAuth 2.0
Procure por: **383086307966-li0lkml4nv6pq6lojm5ce09q9811sii3**

### 3. Verifique os "Authorized redirect URIs"
DEVE conter EXATAMENTE esta URL:
```
http://localhost:3000/api/auth/callback/google
```

### 4. Se não tiver, clique em EDIT e adicione:
- **Authorized JavaScript origins:**
  ```
  http://localhost:3000
  ```

- **Authorized redirect URIs:**
  ```
  http://localhost:3000/api/auth/callback/google
  ```

### 5. Clique em SAVE

### 6. Aguarde 5 minutos
O Google pode levar alguns minutos para propagar as mudanças.

### 7. Reinicie o servidor
```bash
npm run dev
```

### 8. Teste novamente
Vá para http://localhost:3000/login e clique em "Entrar com Google"

---

## 🔍 Como verificar se está funcionando

Quando você clicar no botão Google, deve:
1. Abrir uma tela do Google
2. Pedir para escolher uma conta
3. Pedir permissões
4. Redirecionar de volta para o dashboard

Se continuar dando erro, verifique:
- ✅ Client ID correto no .env.local
- ✅ Client Secret correto no .env.local  
- ✅ URI de redirecionamento correta no Google Cloud
- ✅ OAuth consent screen configurado

---

## 📝 Suas credenciais atuais:

⚠️ **IMPORTANTE:** Nunca exponha suas credenciais no repositório! 

Armazene os seguintes valores em `.env.local`:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Seu Client ID (obtenha em Google Cloud Console)
- `GOOGLE_CLIENT_SECRET`: Seu Client Secret (obtenha em Google Cloud Console)
- Redirect URI necessária: http://localhost:3000/api/auth/callback/google

Consulte o Google Cloud Console para obter seus valores.
