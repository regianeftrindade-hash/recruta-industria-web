#!/bin/bash

# 🚀 SCRIPT DE DEPLOYMENT RÁPIDO - RECRUTA INDÚSTRIA
# Uso: ./deploy.sh

echo "🚀 INICIANDO DEPLOYMENT RECRUTA INDÚSTRIA"
echo "=========================================="

# 1. Verificar se está em um repositório Git
if [ ! -d ".git" ]; then
    echo "❌ Erro: Não é um repositório Git"
    echo "Execute: git init && git remote add origin <seu-repo>"
    exit 1
fi

# 2. Verificar status
echo "📊 Status do Git:"
git status

# 3. Confirmar commit
echo ""
echo "📝 Digite uma mensagem de commit (ex: 'Production deployment'):"
read COMMIT_MESSAGE

# 4. Build local
echo ""
echo "🔨 Fazendo build local..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build falhou!"
    exit 1
fi

# 5. Commit e push
echo ""
echo "📤 Commitando e fazendo push..."
git add .
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo ""
echo "✅ Push realizado com sucesso!"
echo ""
echo "🎯 Próximas ações:"
echo "1. Acesse: https://vercel.com/new"
echo "2. Selecione seu repositório GitHub"
echo "3. Configure as variáveis de ambiente"
echo "4. Clique em Deploy!"
echo ""
echo "Ou use Vercel CLI:"
echo "  npm install -g vercel"
echo "  vercel"
