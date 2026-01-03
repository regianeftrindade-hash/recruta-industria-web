# 🔐 Configuração do Login com Google

## Passo a Passo para Obter as Credenciais do Google

### 1. Acesse o Google Cloud Console
- Vá para: https://console.cloud.google.com/

### 2. Crie um Novo Projeto (ou selecione um existente)
- Clique em "Select a project" no topo
- Clique em "NEW PROJECT"
- Nome: "Recruta Indústria"
- Clique em "CREATE"

### 3. Ative a Google OAuth API
- No menu lateral, vá em: **APIs & Services** > **Library**
- Procure por "Google+ API" ou "Google Identity"
- Clique em **ENABLE**

### 4. Configure a Tela de Consentimento (OAuth consent screen)
- Vá em: **APIs & Services** > **OAuth consent screen**
- Selecione **External** (para testes)
- Clique em **CREATE**
- Preencha:
  - App name: `Recruta Indústria`
  - User support email: seu email
  - Developer contact: seu email
- Clique em **SAVE AND CONTINUE**
- Em "Scopes", clique em **SAVE AND CONTINUE** (pode deixar padrão)
- Em "Test users", adicione seu email para testes
- Clique em **SAVE AND CONTINUE**

### 5. Crie as Credenciais OAuth 2.0
- Vá em: **APIs & Services** > **Credentials**
- Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
- Selecione: **Web application**
- Preencha:
  - Name: `Recruta Indústria Web`
  - Authorized JavaScript origins:
    ```
    http://localhost:3000
    ```
  - Authorized redirect URIs:
    ```
    http://localhost:3000/api/auth/callback/google
    ```
- Clique em **CREATE**

### 6. Copie as Credenciais
Após criar, você verá uma janela com:
- **Client ID** (exemplo: 123456789-abc.apps.googleusercontent.com)
- **Client Secret** (exemplo: GOCSPX-abc123xyz)

### 7. Configure o Arquivo .env.local
Abra o arquivo `.env.local` na raiz do projeto e substitua:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=digite-aqui-uma-string-aleatoria-longa-e-segura

GOOGLE_CLIENT_ID=cole-aqui-seu-client-id
GOOGLE_CLIENT_SECRET=cole-aqui-seu-client-secret
```

**Para gerar o NEXTAUTH_SECRET**, use no terminal:
```bash
openssl rand -base64 32
```

### 8. Reinicie o Servidor
Após configurar o `.env.local`:
```bash
npm run dev
```

---

## ✅ Testando o Login

1. Acesse: http://localhost:3000
2. Clique em "Sou Profissional" ou "Sou Empresa"
3. Clique no botão "Entrar com Google"
4. Faça login com sua conta Google
5. Você será redirecionado para o dashboard!

---

## 🚀 Para Produção

Quando for colocar em produção, você precisará:

1. Adicionar o domínio de produção no Google Cloud Console:
   - Authorized JavaScript origins: `https://seudominio.com`
   - Authorized redirect URIs: `https://seudominio.com/api/auth/callback/google`

2. Atualizar o `.env.local` (ou variáveis de ambiente do servidor):
   ```env
   NEXTAUTH_URL=https://seudominio.com
   ```

3. Mudar o OAuth consent screen de "Testing" para "In production"

---

## 📝 Estrutura Criada

- ✅ `/app/api/auth/[...nextauth]/route.ts` - API do NextAuth
- ✅ `.env.local` - Variáveis de ambiente
- ✅ Login integrado com Google OAuth
- ✅ Redirecionamento automático para o dashboard correto
