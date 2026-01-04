# 🚀 Deploy PWA Online - Guia Rápido

## Opção 1: Vercel (Recomendado - Grátis e Muito Rápido)

### Passo 1: Preparar repositório Git
```powershell
# No seu projeto, faça:
git init
git add .
git commit -m "Initial commit - PWA ready"
git push origin main
```

### Passo 2: Deploy no Vercel
1. Acesse: https://vercel.com
2. Clique em **"New Project"**
3. Selecione seu repositório GitHub
4. Clique em **Deploy**
5. ✅ Pronto! Seu app estará online em `seu-projeto.vercel.app`

**Tempo: 2-3 minutos**

---

## Opção 2: Netlify (Também Grátis)

### Passo 1: Build local primeiro
```powershell
npm ci
npm run build
```

### Passo 2: Deploy
1. Acesse: https://netlify.com
2. Clique em **"New site from Git"**
3. Conecte GitHub
4. Selecione repositório
5. Configurações padrão funcionam
6. Clique **Deploy site**

**Tempo: 1-2 minutos**

---

## Opção 3: Seu próprio servidor

Se tem um servidor/VPS:

```powershell
# Localmente
npm run build

# Upload via SSH/FTP para seu servidor
# Depois no servidor:
npm install
npm start
```

---

## ✅ Checklist Pré-Deploy

- [ ] Git repository pronto
- [ ] `.env` configurado (se tiver variáveis)
- [ ] `npm run build` funciona localmente
- [ ] PWA manifest.json configurado ✅
- [ ] Service Worker ativo ✅
- [ ] Ícones em `public/` ✅

---

## 📱 Acessar depois de publicado

**No Celular (Android/iPhone):**
1. Abra: `seu-site.vercel.app`
2. Menu ⋮ → "Adicionar à tela inicial"
3. Pronto! Funciona como app

**No Computador:**
1. Abra: `seu-site.vercel.app`
2. Clique no ícone ⬇️ na barra de endereço
3. Clique "Instalar"
4. Abre como app na sua área de trabalho

---

## 🔧 Troubleshooting

### "Não aparece opção de instalar"
- Certifique que o manifest.json está em `public/`
- Verifique no DevTools → Application → Manifest
- Service Worker precisa estar ativo

### "Database não conecta"
- Configure variável `DATABASE_URL` em:
  - **Vercel**: Project Settings → Environment Variables
  - **Netlify**: Site Settings → Build & Deploy → Environment

---

## 📊 Próximos Passos

1. **Domínio customizado**: Compre domínio e aponte para Vercel/Netlify
2. **SSL automático**: Vercel/Netlify fazem automaticamente
3. **Analytics**: Ative no dashboard para ver estatísticas
4. **CI/CD**: Seu repositório já tem workflow automático

---

**Recomendação: Use Vercel - é a plataforma oficial do Next.js**
