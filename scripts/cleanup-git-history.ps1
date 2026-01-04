# 🔐 Clean Git History - Remove .env.local from all commits (PowerShell)
# ⚠️ AVISO: Apenas execute se o repositório for PRIVADO

Write-Host "🔐 Limpando histórico do Git..." -ForegroundColor Cyan
Write-Host "⚠️  Este script remove .env.local de TODO o histórico do git" -ForegroundColor Yellow
Write-Host ""

# Verificar se está em um repositório git
try {
  $null = git rev-parse --git-dir 2>$null
} catch {
  Write-Host "❌ Erro: Não está em um repositório git" -ForegroundColor Red
  exit 1
}

# Confirmar ação
$response = Read-Host "Tem certeza? Digite 'SIM' para continuar"
if ($response -ne "SIM") {
  Write-Host "❌ Operação cancelada" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "🔄 Removendo .env.local do histórico..." -ForegroundColor Yellow

# Remover arquivo do histórico
git filter-branch --tree-filter 'rm -f .env.local' -- --all

Write-Host ""
Write-Host "✅ .env.local removido do histórico" -ForegroundColor Green
Write-Host "⚠️  Próxima ação: git push origin --force-with-lease" -ForegroundColor Yellow
Write-Host ""
Write-Host "Comandos para fazer push:" -ForegroundColor Cyan
Write-Host "  git push origin master --force-with-lease"
Write-Host "  git push origin develop --force-with-lease  # se existe branch develop"
