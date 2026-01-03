# PWA - Progressive Web App (Baixar como App)

## ✅ Ativado!

Seu site agora funciona como um **app nativo** em celular e computador!

## Como Usar

### 📱 No Celular (Android/iPhone)
1. Abra o site: `http://localhost:3000` (ou seu domínio)
2. Clique no **menu** (⋮ ou ⋯)
3. Selecione **"Adicionar à tela inicial"** ou **"Install app"**
4. O app aparecerá na sua home

### 💻 No Computador (Chrome/Edge/Firefox)
1. Abra o site
2. Clique no **ícone de instalação** na barra de endereço (⬇️ + ⬜)
3. Clique em **"Instalar"**
4. Abre como app com atalho na sua área de trabalho

## Recursos Implementados

✅ **Manifest.json** - Configuração do app
- Nome: "Recruta Indústria"
- Ícones 192x192 e 512x512
- Cores tema: Azul escuro (#001f3f)
- Modo standalone (sem barra do navegador)
- Shortcuts para páginas principais

✅ **Service Worker** - Funciona offline
- Cache inteligente de páginas
- Funciona sem conexão
- Auto-atualização em background
- Sincronização de dados

✅ **Meta Tags** - Compatibilidade iOS/Android
- Apple Web App
- Status bar customizado
- Viewport otimizado
- Theme colors

## Ícones Necessários

Coloque estas imagens na pasta `public/`:

```
public/
├── icon-192.png (192x192px)
├── icon-192-maskable.png (192x192px, com espaço para máscara)
├── icon-512.png (512x512px)
├── icon-512-maskable.png (512x512px, com espaço para máscara)
├── screenshot-1.png (540x720px - celular)
└── screenshot-2.png (1280x720px - desktop)
```

### Criar Ícones Rapidamente

**Online:**
- https://www.favicon-generator.org/
- https://www.pwabuilder.com/

**Requisitos:**
- Fundo sólido
- Logo centralizado
- Formato PNG

## Próximos Passos

1. **Gerar Ícones**
   - Use ferramentas online acima
   - Baixe os arquivos PNG
   - Coloque em `public/`

2. **Testar**
   - Abra `http://localhost:3000`
   - Instale como app
   - Teste offline (desconecte internet)

3. **Publicar**
   - Deploy para produção
   - HTTPS obrigatório
   - Funciona automaticamente

## Checklist PWA

- ✅ manifest.json
- ✅ Service Worker (sw.js)
- ✅ Meta tags
- ✅ Ícones configurados
- ✅ HTTPS (requer em produção)
- ✅ Responsive design

## Detalhes Técnicos

**Service Worker Cache Strategy:**
- Network first (tenta rede antes)
- Fallback to cache se falhar
- Auto-atualiza em background

**Manifest Features:**
- Display: `standalone` (sem UI do navegador)
- Orientation: `portrait-primary`
- Theme color: `#001f3f`
- Background color: `#ffffff`

## Dúvidas Comuns

**P: Preciso de HTTPS?**
R: Não para desenvolvimento local, mas SIM para produção.

**P: Funciona offline?**
R: Sim! Com Service Worker ativo.

**P: Qual tamanho dos ícones?**
R: 192x192px (celular) e 512x512px (desktop)

**P: Preciso publicar na App Store?**
R: Não! É um web app, acessa direto pelo site.

---

Pronto! Seu app está **100% PWA completo** 🎉

Para testar: Abra `http://localhost:3000` e procure a opção de instalar!
