# 🚀 Deploy Passo a Passo - Vercel

## ✅ Pré-requisitos

- [ ] Conta no GitHub (gratuita)
- [ ] Conta no Vercel (gratuita) - https://vercel.com
- [ ] Seu código já está em um repositório Git ✅

---

## 📝 PASSO 1: Fazer Commit das Mudanças

Você tem 2 arquivos modificados. Vamos salvar tudo no Git:

```powershell
cd c:\Projetos\recruta-industria\recruta-industria-web

# Ver o que foi modificado
git status

# Adicionar todos os arquivos
git add .

# Confirmar as mudanças
git commit -m "fix: corrigir yaml e preparar para deploy PWA"

# Enviar para GitHub
git push origin main
```

**Resultado esperado**: Mensagens confirmando que foram feitos push de 4 arquivos

---

## 🔑 PASSO 2: Conectar GitHub ao Vercel

### 2.1 - Acesse Vercel
1. Abra: https://vercel.com
2. Clique em **"Sign Up"** (ou faça login se já tiver conta)
3. Escolha **"Continue with GitHub"**

### 2.2 - Autorizar GitHub
1. Você será redirecionado ao GitHub
2. Clique em **"Authorize Vercel"**
3. Vercel terá acesso ao seus repositórios

---

## 🚀 PASSO 3: Criar Novo Projeto no Vercel

1. Em Vercel, clique em **"New Project"**
2. Procure por: **"recruta-industria-web"**
3. Clique em **"Import"**

---

## ⚙️ PASSO 4: Configurar Ambiente

### 4.1 - Variáveis de Ambiente
Se precisar de banco de dados, configure aqui:

1. Clique em **"Environment Variables"**
2. Adicione cada variável necessária:

```
DATABASE_URL=sua_url_aqui
NEXT_PUBLIC_API_URL=https://seu-site.vercel.app
```

**Se não sabe que variáveis precisa, clique em Skip por enquanto**

### 4.2 - Build Settings
Deixe as configurações padrão:
- Framework Preset: **Next.js** (automático)
- Build Command: `npm run build` (automático)
- Output Directory: `.next` (automático)

---

## ✨ PASSO 5: Deploy

Clique em **"Deploy"** e espere 2-3 minutos!

Você verá:
```
✓ Build successful
✓ Deploying to production
✓ Ready on https://recruta-industria-web.vercel.app
```

---

## 🎉 Pronto! Seu PWA está online!

### Teste no Celular
1. Abra em seu celular: `https://recruta-industria-web.vercel.app`
2. Menu ⋮ → **"Adicionar à tela inicial"** (Android)
3. Ou Menu → **"Adicionar ao dock"** (iPhone)
4. ✅ Aparece um ícone na home - é seu app!

### Teste no Computador
1. Abra em seu navegador
2. Clique no ícone ⬇️ na barra de endereço
3. Clique **"Instalar"**
4. ✅ Abre como app desktop!

---

## 🔧 Próximas Configurações (Opcional)

### Domínio Customizado
1. No Vercel, vá para **"Domains"**
2. Adicione seu domínio próprio
3. Configure DNS com seu registrador

### Variáveis de Produção
Se tiver erro de conexão com banco de dados:
1. Vá para **"Settings"** → **"Environment Variables"**
2. Adicione `DATABASE_URL` ou outras variáveis necessárias
3. Clique em **"Redeploy"**

### Logs
Para debugar problemas:
1. Clique em **"Deployments"**
2. Veja os logs de build/runtime
3. Verifique erros

---

## 🆘 Troubleshooting

### "Build falhou"
Verifique o log de build no Vercel:
```
1. Abra seu projeto no Vercel
2. Clique em "Deployments"
3. Último deployment → "Build Logs"
4. Procure pela mensagem de erro
```

### "Não conecta ao banco de dados"
- Adicione `DATABASE_URL` nas Environment Variables
- Clique em "Redeploy" após adicionar

### "PWA não instala no celular"
- Verifique se o site abre normalmente primeiro
- Aguarde 5 segundos após carregar
- Tente em outro navegador

---

## 📊 Monitoramento

Após deploy, você pode:

1. **Ver Analytics**: Clique em "Analytics" no Vercel
2. **Gerenciar Variáveis**: Settings → Environment Variables
3. **Ativar/Desativar**: Deployments → Pause/Resume
4. **Revert**: Ir para versão anterior se algo deu errado

---

## ✅ Checklist Final

- [ ] Código feito commit no GitHub
- [ ] Vercel conectado ao GitHub
- [ ] Projeto importado no Vercel
- [ ] Build executado com sucesso
- [ ] URL gerada: `seu-projeto.vercel.app`
- [ ] Testado no celular
- [ ] Testado no computador
- [ ] PWA instalável ✅

---

**Próximo passo depois de online**: Gerar APK para Android (veja `GERAR_APK.md`)
