# =============================================================================
# Propósito: Instala dependencias (si faltan) y arranca el frontend en Vite (puerto 5173).
# Ejecución:
#   powershell -ExecutionPolicy Bypass -File .\frontend\arrancar_frontend.ps1
# =============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  EDUSALDO - INICIANDO FRONTEND WEB (REACT + VITE)" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "Directorio: $ScriptDir`n" -ForegroundColor DarkGray

Push-Location $ScriptDir

try {
    if (-not (Test-Path "$ScriptDir\node_modules")) {
        Write-Host "[1/2] Carpeta node_modules no encontrada. Instalando dependencias..." -ForegroundColor Yellow
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Fallo npm install." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[1/2] Dependencias node_modules encontradas." -ForegroundColor Green
    }

    Write-Host "[2/2] Iniciando servidor de desarrollo en http://localhost:5173..." -ForegroundColor Green
    npm run dev
} finally {
    Pop-Location
}
