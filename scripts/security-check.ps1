#!/usr/bin/env powershell
# 🔐 Security Check Script - Recruta Indústria
# Executa automaticamente verificações de segurança

param(
    [Switch]$Full = $false,
    [Switch]$Fix = $false
)

Write-Host "🔐 SECURITY CHECK - RECRUTA INDÚSTRIA" -ForegroundColor Cyan
Write-Host "=====================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0
$warnings = 0

# Função helper
function Check-Item {
    param(
        [string]$Title,
        [bool]$Result,
        [string]$Message = ""
    )
    
    if ($Result) {
        Write-Host "✅ $Title" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "❌ $Title" -ForegroundColor Red
        if ($Message) { Write-Host "   → $Message" -ForegroundColor Yellow }
        $script:failed++
    }
}

function Warn-Item {
    param(
        [string]$Title,
        [string]$Message = ""
    )
    
    Write-Host "⚠️  $Title" -ForegroundColor Yellow
    if ($Message) { Write-Host "   → $Message" -ForegroundColor Yellow }
    $script:warnings++
}

# ============================================
# 1. GIT CHECKS
# ============================================
Write-Host "`n📁 GIT SECURITY" -ForegroundColor Cyan
Write-Host "==============`n"

# Verificar se está em repo git
$isGitRepo = Test-Path ".git" -PathType Container
Check-Item "Git repository encontrado" $isGitRepo

if ($isGitRepo) {
    # Verificar .env.local em git
    $envLocal = git ls-files -o --exclude-standard | Select-String "\.env\.local"
    $envNotTracked = -not $envLocal
    Check-Item ".env.local não está em git" $envNotTracked "Se estava, execute: git rm --cached .env.local"
    
    # Verificar .gitignore
    $gitignore = Test-Path ".gitignore"
    Check-Item ".gitignore existe" $gitignore
    
    if ($gitignore) {
        $gitignoreContent = Get-Content ".gitignore" -Raw
        $hasEnvLocal = $gitignoreContent -match "\.env\.local"
        Check-Item ".gitignore contém .env.local" $hasEnvLocal
        
        $hasPrismaDb = $gitignoreContent -match "prisma/dev\.db"
        Check-Item ".gitignore contém prisma/dev.db" $hasPrismaDb
    }
    
    # Procurar secrets no histórico
    $secretsInHistory = @()
    try {
        $secretsInHistory = git log --all --full-history -p | Select-String "GOOGLE_CLIENT_SECRET|NEXTAUTH_SECRET|PAGBANK_TOKEN" -ErrorAction SilentlyContinue
    } catch {}
    
    if ($secretsInHistory.Count -gt 0) {
        Warn-Item "Possíveis secrets em histórico git" "Encontrados $($secretsInHistory.Count) ocorrências - execute cleanup-git-history.ps1"
    } else {
        Check-Item "Nenhum secret aparente em histórico git" $true
    }
}

# ============================================
# 2. ENVIRONMENT VARIABLES
# ============================================
Write-Host "`n🔑 ENVIRONMENT VARIABLES" -ForegroundColor Cyan
Write-Host "=======================`n"

$envExists = Test-Path ".env.local"
Check-Item ".env.local existe" $envExists

if ($envExists) {
    # Carregar .env.local
    $envContent = Get-Content ".env.local" -Raw
    
    # Verificar NEXTAUTH_SECRET
    $hasNextAuthSecret = $envContent -match "NEXTAUTH_SECRET=.+"
    Check-Item "NEXTAUTH_SECRET configurado" $hasNextAuthSecret
    
    if ($hasNextAuthSecret) {
        $nextAuthSecret = ([regex]::Match($envContent, "NEXTAUTH_SECRET=([^\n\r]+)")).Groups[1].Value
        $secretLength = $nextAuthSecret.Length
        $validLength = $secretLength -ge 32
        Check-Item "NEXTAUTH_SECRET com comprimento >= 32" $validLength "Comprimento atual: $secretLength"
    }
    
    # Verificar Google secrets
    $hasGoogleId = $envContent -match "GOOGLE_CLIENT_ID=.+"
    Check-Item "GOOGLE_CLIENT_ID configurado" $hasGoogleId
    
    $hasGoogleSecret = $envContent -match "GOOGLE_CLIENT_SECRET=.+"
    Check-Item "GOOGLE_CLIENT_SECRET configurado" $hasGoogleSecret
    
    # Verificar DATABASE_URL
    $hasDbUrl = $envContent -match "DATABASE_URL=.+"
    Check-Item "DATABASE_URL configurado" $hasDbUrl
    
    # Avisos
    if ($envContent -match "NODE_ENV=development") {
        Warn-Item "NODE_ENV=development" "Em produção deve ser 'production'"
    }
} else {
    Warn-Item ".env.local não encontrado" "Execute: cp .env.example .env.local e configure"
}

# ============================================
# 3. SOURCE CODE
# ============================================
Write-Host "`n📝 SOURCE CODE SECURITY" -ForegroundColor Cyan
Write-Host "======================`n"

# Procurar secrets hardcoded
$secretPatterns = @(
    "GOOGLE_CLIENT_SECRET\s*=\s*['\"]",
    "NEXTAUTH_SECRET\s*=\s*['\"]",
    "password\s*:\s*['\"][a-zA-Z0-9]",
    "apiKey\s*:\s*['\"]"
)

$hasSecrets = $false
foreach ($pattern in $secretPatterns) {
    $found = Get-ChildItem -Path ".\app", ".\src", ".\lib" -Recurse -Include "*.ts", "*.tsx", "*.js", "*.jsx" -ErrorAction SilentlyContinue |
        Select-String $pattern -ErrorAction SilentlyContinue
    if ($found) {
        $hasSecrets = $true
        Write-Host "⚠️  Possível secret hardcoded em: $($found.Path)" -ForegroundColor Yellow
    }
}
Check-Item "Nenhum secret hardcoded aparente" (-not $hasSecrets)

# Verificar environment.ts ou similar
$envFile = Get-ChildItem -Path ".\src", ".\lib" -Include "*env*" -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Extension -in ".ts", ".tsx", ".js" }
if ($envFile) {
    Check-Item "Arquivo de configuração de ambiente encontrado" $true
}

# ============================================
# 4. DEPENDENCIES
# ============================================
Write-Host "`n📦 DEPENDENCIES" -ForegroundColor Cyan
Write-Host "==============`n"

$packageJsonExists = Test-Path "package.json"
Check-Item "package.json existe" $packageJsonExists

if ($packageJsonExists) {
    $npmLockExists = (Test-Path "package-lock.json") -or (Test-Path "yarn.lock") -or (Test-Path "pnpm-lock.yaml")
    Check-Item "Lock file existe" $npmLockExists
    
    if ((Test-Path "node_modules") -eq $false) {
        Warn-Item "node_modules não encontrado" "Execute: npm install"
    } else {
        Check-Item "node_modules instalado" $true
    }
    
    # npm audit (se Full)
    if ($Full) {
        Write-Host "`n▶️  Executando npm audit..." -ForegroundColor Cyan
        try {
            $auditResult = npm audit 2>&1
            if ($auditResult -match "found 0 vulnerabilities") {
                Check-Item "npm audit: Nenhuma vulnerabilidade" $true
            } else {
                Warn-Item "npm audit: Vulnerabilidades encontradas" $auditResult[0]
            }
        } catch {
            Warn-Item "npm audit falhou" $_.Exception.Message
        }
    }
}

# ============================================
# 5. BUILD & CONFIGURATION
# ============================================
Write-Host "`n🔨 BUILD & CONFIG" -ForegroundColor Cyan
Write-Host "================`n"

$nextConfigExists = Test-Path "next.config.ts" -or (Test-Path "next.config.js")
Check-Item "Next.js config encontrado" $nextConfigExists

$prismaPrismaExists = Test-Path "prisma/schema.prisma"
Check-Item "Prisma schema encontrado" $prismaPrismaExists

$tsConfigExists = Test-Path "tsconfig.json"
Check-Item "TypeScript config encontrado" $tsConfigExists

# ============================================
# 6. FILE PERMISSIONS (Linux/Mac)
# ============================================
if ($PSVersionTable.Platform -ne "Win32NT") {
    Write-Host "`n🔒 FILE PERMISSIONS" -ForegroundColor Cyan
    Write-Host "==================`n"
    
    $envLocalPerms = ls -l .env.local 2>/dev/null | awk '{print $1}'
    if ($envLocalPerms -eq "-rw-------") {
        Check-Item ".env.local tem permissões 600" $true
    } else {
        Warn-Item ".env.local permissions inseguras" "Execute: chmod 600 .env.local"
    }
}

# ============================================
# RESUMO
# ============================================
Write-Host "`n`n📊 RESUMO" -ForegroundColor Cyan
Write-Host "========`n"

$total = $passed + $failed + $warnings
Write-Host "✅ Passou: $passed"
Write-Host "❌ Falhou: $failed"
Write-Host "⚠️  Avisos: $warnings"
Write-Host "`nTotal: $total verificações"

# ============================================
# RECOMENDAÇÕES
# ============================================
if ($failed -gt 0) {
    Write-Host "`n🚨 AÇÕES RECOMENDADAS:" -ForegroundColor Red
    
    if (-not $envExists) {
        Write-Host "1. Copiar .env.example → .env.local"
        Write-Host "   cp .env.example .env.local"
    }
    
    if ($failed -gt 0) {
        Write-Host "2. Revisar pontos falhos acima"
        Write-Host "3. Consultar SECURITY_CHECKLIST.md"
    }
}

if ($Full -and $failed -eq 0) {
    Write-Host "`n✨ SEGURANÇA OK!" -ForegroundColor Green
}

# Exit code
exit $failed
