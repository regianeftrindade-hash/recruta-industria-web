# 📦 Gerar APK Android - Guia Completo

## 🎯 Melhor Opção: PWABuilder (Microsoft)

A forma **mais fácil e rápida** para gerar APK da sua PWA!

### Passo 1: Preparar o PWA Online
Primeiro, suba seu projeto para Vercel/Netlify (confira `DEPLOY_PWA.md`)

Você precisará de uma URL como: `https://seu-site.vercel.app`

### Passo 2: Acessar PWABuilder
1. Abra: https://www.pwabuilder.com/
2. Cole sua URL no campo "Enter your website URL"
3. Clique em **"Start"**

### Passo 3: Gerar APK
1. Na aba **"Windows, Android, and iOS"**
2. Clique em **"Android"** → **"Generate"**
3. Será baixado um arquivo `.apk` em 1-2 minutos

### Passo 4: Testar no Celular
```
1. Conecte seu Android ao PC via USB
2. Copie o arquivo .apk para o celular
3. No celular: Abra o arquivo .apk
4. Clique "Instalar"
5. ✅ Pronto! App instalado!
```

**Vantagem**: Não precisa de Android Studio, Java, ou qualquer configuração complexa!

---

## 🔧 Alternativa: Bubblewrap (Google - Mais Controle)

Se quiser mais customização, use a ferramenta oficial do Google.

### Instalação
```powershell
npm install -g @bubblewrap/cli
```

### Gerar APK
```powershell
bubblewrap init --manifest=https://seu-site.vercel.app/manifest.json
bubblewrap build
```

Resultado: arquivo `.apk` em `dist/`

---

## 🛠️ Opção Avançada: Capacitor + Android Studio

Para controle total e funcionalidades nativas.

### Instalação
```powershell
npm install -g @capacitor/core @capacitor/cli
npx cap init
npx cap add android
npx cap open android
```

### No Android Studio
1. Clique em **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. Arquivo gerado em `app/release/app-release.apk`

---

## 📋 Checklist antes de Gerar APK

- [ ] PWA publicada online (Vercel/Netlify) ✅
- [ ] Manifest.json configurado ✅
- [ ] Service Worker ativo ✅
- [ ] Ícones 192x192 e 512x512 em `public/` ✅
- [ ] URL HTTPS (obrigatório!)

---

## 🔐 Assinatura do APK (Opcional - Para Play Store)

Se só quer distribuir direto (sem Play Store), **não precisa assinar**.

Para Play Store, você precisa:
```powershell
# Gerar chave de assinatura
keytool -genkey -v -keystore recruta.keystore -keyalg RSA -keysize 2048 -validity 10000

# Assinar APK
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore recruta.keystore app.apk alias_name
```

---

## 📱 Distribuição do APK

### Opção 1: Download Direto (Mais Simples)
1. Hospede o `.apk` em um servidor
2. Compartilhe o link: `https://seu-servidor.com/app.apk`
3. Qualquer um pode baixar e instalar

### Opção 2: Google Play Store (Com Assinatura)
1. Crie conta de desenvolvedor Google ($25 de taxa)
2. Upload do APK assinado
3. Aplicativo aparece na Play Store

### Opção 3: GitHub Releases (Grátis)
```powershell
# Crie uma release no GitHub
# Faça upload do .apk como asset
# Qualquer um pode baixar em: github.com/seu-repo/releases
```

---

## 🐛 Troubleshooting

### "APK não abre no celular"
- Verifique se seu telefone permite instalação de fontes desconhecidas:
  - Configurações → Segurança → Fontes desconhecidas → ON
- Tente outra versão do APK

### "Erro ao acessar dados online"
- Certifique-se que `DATABASE_URL` está configurada
- Verifique conexão do celular com internet

### "Tamanho do APK muito grande"
- PWABuilder otimiza automaticamente
- Remova bibliotecas não usadas: `npm run build`

---

## 📊 Próximos Passos

1. **Teste em múltiplos celulares** antes de distribuir
2. **Adicione ícone customizado** para diferenciar do web app
3. **Configure tela de splash** (imagem ao abrir app)
4. **Implemente push notifications** (opcional)

---

## ⚡ RESUMO RÁPIDO (3 PASSOS)

```
1. Acesse: https://www.pwabuilder.com/
2. Cole URL: https://seu-site.vercel.app
3. Download do .apk → Pronto!
```

**Tempo total: 5 minutos**

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas:
- PWABuilder: https://docs.pwabuilder.com/
- Bubblewrap: https://github.com/GoogleChromeLabs/bubblewrap
- Capacitor: https://capacitorjs.com/docs/android
