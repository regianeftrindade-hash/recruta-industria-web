# Script para compilar/install `better-sqlite3` e rodar migração
# Execute este script em uma sessão elevada DO "Developer PowerShell for VS" (ou após rodar VsDevCmd.bat)

Write-Output "Executando build-and-migrate.ps1"

Set-Location -Path (Split-Path -Path $MyInvocation.MyCommand.Definition -Parent)

# Se existir o VsDevCmd, execute para preparar o ambiente de build
[string[]]$vsDevCmdPaths = @( 
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\Common7\Tools\VsDevCmd.bat",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\Common7\Tools\VsDevCmd.bat"
)
foreach ($p in $vsDevCmdPaths) {
    if (Test-Path $p) {
        Write-Output "Executando $p"
        & $p
        break
    }
}

Write-Output "Limpando e rebuildando dependências (opcional)"
npm rebuild --no-audit --no-fund

Write-Output "Instalando better-sqlite3 (compilando a partir do source)"
npm install --build-from-source better-sqlite3 --loglevel=info

Write-Output "Verificando availability do módulo"
try {
    node -e "console.log(require.resolve('better-sqlite3'))"
} catch {
    Write-Error "Não foi possível resolver 'better-sqlite3'. Verifique logs acima e se o Visual Studio Build Tools + Python estão instalados."
    exit 1
}

Write-Output "Rodando migração de pagamentos"
npm run migrate:payments

Write-Output "Concluído. Se houver erros, cole os logs aqui para eu analisar."
