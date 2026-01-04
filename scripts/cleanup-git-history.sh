#!/bin/bash
# 🔐 Clean Git History - Remove .env.local from all commits
# ⚠️ AVISO: Apenas execute se o repositório for PRIVADO

echo "🔐 Limpando histórico do Git..."
echo "⚠️  Este script remove .env.local de TODO o histórico do git"
echo ""

# Verificar se está em um repositório git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Erro: Não está em um repositório git"
  exit 1
fi

# Confirmar ação
read -p "Tem certeza? Digite 'SIM' para continuar: " -r
if [[ ! $REPLY =~ ^SIM$ ]]; then
  echo "❌ Operação cancelada"
  exit 1
fi

echo ""
echo "🔄 Removendo .env.local do histórico..."
git filter-branch --tree-filter 'rm -f .env.local' -- --all

echo ""
echo "✅ .env.local removido do histórico"
echo "⚠️  Próxima ação: git push origin --force-with-lease"
echo ""
echo "Comandos para fazer push:"
echo "  git push origin master --force-with-lease"
echo "  git push origin develop --force-with-lease  # se existe branch develop"
