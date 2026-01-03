# Instala Visual Studio Build Tools (Desktop development with C++)
# Salve este arquivo e execute como Administrador.

$exe = "$env:TEMP\vs_BuildTools.exe"
Write-Output "Baixando vs_BuildTools.exe para $exe"
Invoke-WebRequest "https://aka.ms/vs/17/release/vs_BuildTools.exe" -OutFile $exe

Write-Output "Iniciando instalador (workload: VCTools). Isto pode demorar."
Start-Process -Wait -FilePath $exe -ArgumentList "--add Microsoft.VisualStudio.Workload.VCTools --quiet --wait --norestart --nocache" -Verb RunAs

Write-Output "Instalação concluída (se não houver erro). Reinicie o terminal antes de compilar módulos nativos."
