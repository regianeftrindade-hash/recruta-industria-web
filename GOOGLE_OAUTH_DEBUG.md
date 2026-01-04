# 🔐 Diagnóstico e Configuração do Google OAuth

## Status Atual

✅ **O código está pronto!** Mas você precisa configurar as credenciais no Google Cloud Console.

---

## 🔍 Verificar Configuração

Acesse: **http://localhost:3000/api/auth/debug-google**

Este endpoint mostra:
- ✅/❌ Se as variáveis de ambiente estão configuradas
- 📋 A URL de callback que você precisa adicionar no Google
- 📝 Instruções passo-a-passo

---

## ⚙️ Passo a Passo para Configurar Google OAuth

### 1. Abra o Google Cloud Console
- URL: https://console.cloud.google.com/
- Faça login com sua conta Google

### 2. Selecione ou Crie um Projeto
- Clique em "Select a project" no topo
- Se não existe um projeto:
  - Clique em "NEW PROJECT"
  - Nome: "Recruta Indústria"
  - Clique em "CREATE"

### 3. Acesse as Credenciais OAuth 2.0
- Menu esquerdo: **APIs & Services** > **Credentials**
- Procure por "OAuth 2.0 Client IDs"
- Se não encontrar, crie uma nova:
  - Clique em **+ CREATE CREDENTIALS**
  - Tipo: **OAuth client ID**
  - Tipo de aplicação: **Web application**
  - Nome: "Recruta Indústria Web"

### 4. Configure as URLs Autorizadas
Clique na credencial e procure por estes dois campos:

#### 🟦 Authorized JavaScript Origins
**Adicione:**
```
http://localhost:3000
```

**Para produção, adicione também:**
```
https://seudominio.com
```

#### 🟦 Authorized redirect URIs
**Adicione:**
```
http://localhost:3000/api/auth/callback/google
```

**Para produção, adicione também:**
```
https://seudominio.com/api/auth/callback/google
```

### 5. Salve as Alterações
- Clique em **SAVE**
- Copie o **Client ID**
- Copie o **Client Secret**

### 6. Configure o .env.local
Abra o arquivo `.env.local` e atualize:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=recruta-industria-segredo-local-123456

GOOGLE_CLIENT_ID=cole-aqui-seu-client-id
GOOGLE_CLIENT_SECRET=cole-aqui-seu-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=cole-aqui-seu-client-id
```

### 7. Reinicie o Servidor
```bash
npm run dev
```

---

## ✅ Teste o Login

1. Acesse: http://localhost:3000/login
2. Clique em "Entrar com Google"
3. Selecione sua conta Google
4. Você será redirecionado para o dashboard

---

## 🐛 Troubleshooting

### Erro: "Credential not found"
- ✅ Solução: Certifique-se de que a URL de callback está configurada no Google Console
- Deve ser: `http://localhost:3000/api/auth/callback/google`

### Erro: "Invalid OAuth 2.0 Scopes"
- ✅ Solução: Deixe os escopos padrão (você não precisa mudá-los)

### Erro: "Redirect URI mismatch"
- ✅ Solução: Verifique se a URL de callback está EXATAMENTE igual ao configurado:
  - Desenvolvido: `http://localhost:3000/api/auth/callback/google`
  - Produção: `https://seudominio.com/api/auth/callback/google`

### Erro: "Client ID não reconhecido"
- ✅ Solução: Verifique se copieu o Client ID correto (não o Secret)

### Botão de Google não aparece na página de login
- ✅ Solução: Verifique se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está configurado
- Deve ser o MESMO valor de `GOOGLE_CLIENT_ID`

---

## 📊 Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXTAUTH_URL` | URL base da aplicação | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Chave secreta para JWT | Gere com: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | ID da credencial Google | `123456-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Secret da credencial Google | `GOCSPX-abc123xyz` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ID público (mesmo que acima) | `123456-abc.apps.googleusercontent.com` |

---

## 🚀 Próximas Etapas

Após configurar e testar em `localhost:3000`:

1. **Para Produção:**
   - Mude o OAuth consent screen de "Testing" para "In production"
   - Adicione o domínio de produção no Google Console
   - Atualize `NEXTAUTH_URL` para `https://seudominio.com`

2. **Segurança:**
   - Use `openssl rand -base64 32` para gerar um `NEXTAUTH_SECRET` seguro
   - Não compartilhe o `GOOGLE_CLIENT_SECRET`

3. **Monitoramento:**
   - Verifique os logs em `/api/auth/debug-google` se houver problemas
   - O console do navegador (F12) mostrará erros detalhados

---

## 💡 Dicas

- **Usar localhost?** Certifique-se que tem `http://` (não `https://`)
- **Mudou o domínio?** Atualize em DOIS lugares: Google Console + `.env.local`
- **Teste no incógnito** para evitar cache de cookies de autenticação anterior
- **Verifique os logs** do servidor: `npm run dev` mostrará erros em tempo real

---

## ✨ Status

- ✅ Código NextAuth implementado e pronto
- ✅ Endpoints de callback configurados
- ✅ Endpoint de debug disponível em `/api/auth/debug-google`
- ⏳ **PRÓXIMO PASSO:** Configure as credenciais no Google Cloud Console
