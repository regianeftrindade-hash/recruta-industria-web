#!/bin/bash
# 🔐 Security Check Script - Recruta Indústria
# Executa automaticamente verificações de segurança

set -e

FULL=false
FIX=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --full) FULL=true; shift ;;
    --fix) FIX=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

passed=0
failed=0
warnings=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

check_item() {
  local title="$1"
  local result="$2"
  local message="${3:-}"
  
  if [ "$result" = "true" ]; then
    echo -e "${GREEN}✅ $title${NC}"
    ((passed++))
  else
    echo -e "${RED}❌ $title${NC}"
    [ -n "$message" ] && echo -e "   → ${YELLOW}$message${NC}"
    ((failed++))
  fi
}

warn_item() {
  local title="$1"
  local message="${2:-}"
  
  echo -e "${YELLOW}⚠️  $title${NC}"
  [ -n "$message" ] && echo -e "   → ${YELLOW}$message${NC}"
  ((warnings++))
}

# ============================================
# HEADER
# ============================================
echo -e "${CYAN}🔐 SECURITY CHECK - RECRUTA INDÚSTRIA${NC}"
echo -e "${CYAN}=====================================${NC}\n"

# ============================================
# 1. GIT CHECKS
# ============================================
echo -e "${CYAN}\n📁 GIT SECURITY${NC}"
echo -e "${CYAN}==============${NC}\n"

# Check if git repo
if [ -d ".git" ]; then
  check_item "Git repository encontrado" "true"
  
  # Check .env.local in git
  if git ls-files -o --exclude-standard | grep -q "\.env\.local"; then
    check_item ".env.local não está em git" "false" "Execute: git rm --cached .env.local"
  else
    check_item ".env.local não está em git" "true"
  fi
  
  # Check .gitignore
  if [ -f ".gitignore" ]; then
    check_item ".gitignore existe" "true"
    
    if grep -q "\.env\.local" .gitignore; then
      check_item ".gitignore contém .env.local" "true"
    else
      check_item ".gitignore contém .env.local" "false"
    fi
    
    if grep -q "prisma/dev\.db" .gitignore; then
      check_item ".gitignore contém prisma/dev.db" "true"
    else
      check_item ".gitignore contém prisma/dev.db" "false"
    fi
  else
    check_item ".gitignore existe" "false"
  fi
  
  # Check for secrets in history
  if git log --all --full-history -p 2>/dev/null | grep -q "GOOGLE_CLIENT_SECRET\|NEXTAUTH_SECRET\|PAGBANK_TOKEN"; then
    warn_item "Possíveis secrets em histórico git" "Execute scripts/cleanup-git-history.sh"
  else
    check_item "Nenhum secret aparente em histórico git" "true"
  fi
else
  check_item "Git repository encontrado" "false"
fi

# ============================================
# 2. ENVIRONMENT VARIABLES
# ============================================
echo -e "${CYAN}\n🔑 ENVIRONMENT VARIABLES${NC}"
echo -e "${CYAN}=======================${NC}\n"

if [ -f ".env.local" ]; then
  check_item ".env.local existe" "true"
  
  # Check NEXTAUTH_SECRET
  if grep -q "NEXTAUTH_SECRET=" .env.local; then
    check_item "NEXTAUTH_SECRET configurado" "true"
    
    SECRET_LENGTH=$(grep "NEXTAUTH_SECRET=" .env.local | cut -d'=' -f2 | wc -c)
    if [ "$SECRET_LENGTH" -ge 32 ]; then
      check_item "NEXTAUTH_SECRET com comprimento >= 32" "true"
    else
      check_item "NEXTAUTH_SECRET com comprimento >= 32" "false" "Comprimento atual: $SECRET_LENGTH"
    fi
  else
    check_item "NEXTAUTH_SECRET configurado" "false"
  fi
  
  # Check Google credentials
  if grep -q "GOOGLE_CLIENT_ID=" .env.local; then
    check_item "GOOGLE_CLIENT_ID configurado" "true"
  else
    check_item "GOOGLE_CLIENT_ID configurado" "false"
  fi
  
  if grep -q "GOOGLE_CLIENT_SECRET=" .env.local; then
    check_item "GOOGLE_CLIENT_SECRET configurado" "true"
  else
    check_item "GOOGLE_CLIENT_SECRET configurado" "false"
  fi
  
  # Check DATABASE_URL
  if grep -q "DATABASE_URL=" .env.local; then
    check_item "DATABASE_URL configurado" "true"
  else
    check_item "DATABASE_URL configurado" "false"
  fi
  
  # Check NODE_ENV
  if grep -q "NODE_ENV=development" .env.local; then
    warn_item "NODE_ENV=development" "Em produção deve ser 'production'"
  fi
else
  check_item ".env.local existe" "false" "Execute: cp .env.example .env.local"
fi

# ============================================
# 3. SOURCE CODE
# ============================================
echo -e "${CYAN}\n📝 SOURCE CODE SECURITY${NC}"
echo -e "${CYAN}=====================${NC}\n"

# Check for hardcoded secrets
FOUND_SECRETS=false
for pattern in "GOOGLE_CLIENT_SECRET\s*=\s*['\"]" "NEXTAUTH_SECRET\s*=\s*['\"]"; do
  if grep -r -E "$pattern" app/ src/ lib/ 2>/dev/null | grep -v ".next/" | grep -v "node_modules"; then
    warn_item "Possível secret hardcoded encontrado"
    FOUND_SECRETS=true
  fi
done

if [ "$FOUND_SECRETS" = false ]; then
  check_item "Nenhum secret hardcoded aparente" "true"
fi

# ============================================
# 4. DEPENDENCIES
# ============================================
echo -e "${CYAN}\n📦 DEPENDENCIES${NC}"
echo -e "${CYAN}==============${NC}\n"

if [ -f "package.json" ]; then
  check_item "package.json existe" "true"
  
  if [ -f "package-lock.json" ] || [ -f "yarn.lock" ] || [ -f "pnpm-lock.yaml" ]; then
    check_item "Lock file existe" "true"
  else
    check_item "Lock file existe" "false"
  fi
  
  if [ -d "node_modules" ]; then
    check_item "node_modules instalado" "true"
  else
    warn_item "node_modules não encontrado" "Execute: npm install"
  fi
  
  # npm audit if --full
  if [ "$FULL" = true ]; then
    echo -e "\n▶️  Executando npm audit...\n"
    if npm audit 2>&1 | grep -q "found 0 vulnerabilities"; then
      check_item "npm audit: Nenhuma vulnerabilidade" "true"
    else
      warn_item "npm audit: Vulnerabilidades encontradas"
    fi
  fi
else
  check_item "package.json existe" "false"
fi

# ============================================
# 5. BUILD & CONFIGURATION
# ============================================
echo -e "${CYAN}\n🔨 BUILD & CONFIG${NC}"
echo -e "${CYAN}================${NC}\n"

if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
  check_item "Next.js config encontrado" "true"
else
  check_item "Next.js config encontrado" "false"
fi

if [ -f "prisma/schema.prisma" ]; then
  check_item "Prisma schema encontrado" "true"
else
  check_item "Prisma schema encontrado" "false"
fi

if [ -f "tsconfig.json" ]; then
  check_item "TypeScript config encontrado" "true"
else
  check_item "TypeScript config encontrado" "false"
fi

# ============================================
# 6. FILE PERMISSIONS
# ============================================
echo -e "${CYAN}\n🔒 FILE PERMISSIONS${NC}"
echo -e "${CYAN}==================${NC}\n"

if [ -f ".env.local" ]; then
  PERMS=$(stat -f "%OLp" .env.local 2>/dev/null || stat -c "%a" .env.local 2>/dev/null)
  if [ "$PERMS" = "600" ] || [ "$PERMS" = "-rw-------" ]; then
    check_item ".env.local tem permissões 600" "true"
  else
    warn_item ".env.local permissions inseguras" "Execute: chmod 600 .env.local"
  fi
fi

# ============================================
# SUMMARY
# ============================================
TOTAL=$((passed + failed + warnings))

echo -e "\n${CYAN}📊 RESUMO${NC}"
echo -e "${CYAN}========${NC}\n"
echo -e "${GREEN}✅ Passou: $passed${NC}"
echo -e "${RED}❌ Falhou: $failed${NC}"
echo -e "${YELLOW}⚠️  Avisos: $warnings${NC}"
echo -e "\nTotal: $TOTAL verificações\n"

# ============================================
# RECOMMENDATIONS
# ============================================
if [ $failed -gt 0 ]; then
  echo -e "${RED}🚨 AÇÕES RECOMENDADAS:${NC}"
  
  if [ ! -f ".env.local" ]; then
    echo "1. Copiar .env.example → .env.local"
    echo "   cp .env.example .env.local"
  fi
  
  echo "2. Revisar pontos falhos acima"
  echo "3. Consultar SECURITY_CHECKLIST.md"
fi

if [ "$FULL" = true ] && [ $failed -eq 0 ]; then
  echo -e "${GREEN}✨ SEGURANÇA OK!${NC}\n"
fi

exit $failed
