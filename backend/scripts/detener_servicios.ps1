# =============================================================================
# Proposito: Detiene todos los microservicios de EduSaldo y el API Gateway
#            liberando los puertos 8090, 8091, 8092, 8093 y 8094.
# Ejecucion: powershell -ExecutionPolicy Bypass -File .\backend\scripts\detener_servicios.ps1
# =============================================================================

$Ports = @(8090, 8091, 8092, 8093, 8094)
$StoppedCount = 0

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  EDUSALDO - DETENIENDO MICROSERVICIOS Y GATEWAY" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan

foreach ($port in $Ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "  [STOP] Deteniendo proceso $($p.ProcessName) (PID: $($p.Id)) en puerto $port..." -ForegroundColor Yellow
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
                $StoppedCount++
            }
        }
    }
}

if ($StoppedCount -eq 0) {
    Write-Host "  [INFO] No habia procesos activos en los puertos 8090..8094." -ForegroundColor DarkGray
} else {
    Write-Host "  [OK] Se detuvieron $StoppedCount procesos correctamente." -ForegroundColor Green
}
