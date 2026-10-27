# =============================================================================
# Propósito: Suite de Pruebas de Borde y Casos de Ataque ("Teacher Attack Suite")
#            Diseñada para evaluar la resiliencia y el blindaje ante intentos
#            deliberados de romper las invariantes de negocio de EduSaldo.
#            Verificación estricta de códigos HTTP y mensajes de error reales
#            sin falsos positivos por errores de validación sintáctica (400).
# =============================================================================

$Gateway = "http://localhost:8090"
$Passed = 0
$Failed = 0

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        $Body = $null
    )
    $url = "$Gateway$Endpoint"
    $statusCode = 0
    $resObj = $null

    try {
        $headers = @{ "Content-Type" = "application/json" }
        if ($null -ne $Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 5
            $resp = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -Body $jsonBody -UseBasicParsing -TimeoutSec 15
        } else {
            $resp = Invoke-WebRequest -Uri $url -Method $Method -Headers $headers -UseBasicParsing -TimeoutSec 15
        }
        $statusCode = [int]$resp.StatusCode
        if ($resp.Content) {
            $resObj = $resp.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        }
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $raw = $reader.ReadToEnd()
                $resObj = $raw | ConvertFrom-Json -ErrorAction SilentlyContinue
            } catch {}
        } else {
            $statusCode = 500
        }
    }

    return @{ StatusCode = $statusCode; Body = $resObj }
}

function Check-Edge {
    param(
        [string]$Num,
        [string]$Title,
        $Detail,
        [int[]]$ExpectedCodes = @(422),
        [string]$ExpectedMessageContains = "",
        [bool]$AllowValidationError = $false
    )
    $codeMatch = $Detail.StatusCode -in $ExpectedCodes
    $msgMatch = $true
    if ($ExpectedMessageContains -ne "") {
        $msg = if ($Detail.Body -and $Detail.Body.message) { [string]$Detail.Body.message } else { "" }
        $msgMatch = $msg -like "*$ExpectedMessageContains*"
    }
    $valError = if ($Detail.Body -and $Detail.Body.error) { $Detail.Body.error -eq "Validation Error" } else { $false }
    $notValError = $AllowValidationError -or (-not $valError)

    $success = $codeMatch -and $msgMatch -and $notValError

    if ($success) {
        $global:Passed++
        Write-Host "  [PASS] $Num. $Title -> Rechazo esperado ($($Detail.StatusCode)): $($Detail.Body.message)" -ForegroundColor Green
    } else {
        $global:Failed++
        $gotMsg = if ($Detail.Body) { $Detail.Body.message } else { "Sin cuerpo" }
        Write-Host "  [FAIL] $Num. $Title -> Obtenido: $($Detail.StatusCode) (Msg: '$gotMsg'), Esperado: ($($ExpectedCodes -join ',')) con '$ExpectedMessageContains'" -ForegroundColor Red
        if ($Detail.Body) { Write-Host "         Respuesta: $($Detail.Body | ConvertTo-Json -Compress)" -ForegroundColor DarkGray }
    }
}

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  EDUSALDO - SUITE DE CASOS DE BORDE Y RESILIENCIA (15 CONTROLES)" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan

# 1. Registro público de Administrador bloqueado (HU02 CA1)
$r1 = Invoke-Api -Method POST -Endpoint "/api/usuarios" -Body @{
    idEstablecimiento = 1
    rut = "19.999.888-7"
    primerNombre = "Hacker"
    primerApellido = "Admin"
    correo = "hacker@test.cl"
    rol = "ADMINISTRADOR"
}
Check-Edge -Num "E01" -Title "Bloqueo de creación pública de Administrador (HU02 CA1)" -Detail $r1 -ExpectedCodes @(400, 422) -ExpectedMessageContains "HU02 CA1"

# 2. Abono con monto negativo o cero bloqueado
$r2 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/iniciar" -Body @{
    alumnoId = 4
    apoderadoId = 3
    monto = -5000
}
Check-Edge -Num "E02" -Title "Bloqueo de abono con monto negativo/cero" -Detail $r2 -ExpectedCodes @(400) -ExpectedMessageContains "monto" -AllowValidationError $true

# 3. Abono para alumno sin vínculo con el apoderado bloqueado (S11)
$r3 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/iniciar" -Body @{
    alumnoId = 9 # Alumno de Colegio 2
    apoderadoId = 3 # Apoderado de Colegio 1
    monto = 10000
}
Check-Edge -Num "E03" -Title "Bloqueo de abono para alumno no vinculado (S11)" -Detail $r3 -ExpectedCodes @(400, 422) -ExpectedMessageContains "nculo"

# 4. Retención de saldo mayor al disponible bloqueada (Invariante Saldo)
$r4 = Invoke-Api -Method POST -Endpoint "/api/saldos/retener" -Body @{
    alumnoId = 4
    monto = 99999999
    reservaId = 9999
}
Check-Edge -Num "E04" -Title "Invariante de Saldo: Rechazo por sobregiro" -Detail $r4 -ExpectedCodes @(422) -ExpectedMessageContains "Saldo insuficiente"

# 5. Retención de stock mayor al físico disponible bloqueada (Invariante Stock)
$r5 = Invoke-Api -Method POST -Endpoint "/api/inventario/retener" -Body @{
    productoId = 1
    cantidad = 999999
    reservaId = 9999
    usuarioId = 3
}
Check-Edge -Num "E05" -Title "Invariante de Stock: Rechazo por stock insuficiente" -Detail $r5 -ExpectedCodes @(422) -ExpectedMessageContains "Stock insuficiente"

# 6. Auto-aprobación de ajuste de stock por el mismo Encargado bloqueada (HU44 CA3)
# Creamos una solicitud de ajuste por encargado 2
$rAjuste = Invoke-Api -Method POST -Endpoint "/api/inventario/ajustes/solicitar" -Body @{
    idEstablecimiento = 1
    productoId = 1
    cantidad = 5
    motivo = "Reposición de prueba para evaluar auto-aprobación"
    encargadoId = 2
}
if ($rAjuste.StatusCode -ne 201) {
    Write-Host "  [WARN] No se pudo crear ajuste previo para E06 (Status $($rAjuste.StatusCode))" -ForegroundColor Yellow
}
$solId = if ($rAjuste.Body.id) { $rAjuste.Body.id } else { 1 }
# Encargado 2 intenta aprobar su propia solicitud
$r6 = Invoke-Api -Method POST -Endpoint "/api/inventario/ajustes/$solId/aprobar" -Body @{
    administradorId = 2
}
Check-Edge -Num "E06" -Title "Bloqueo de auto-aprobación de ajuste por el solicitante (HU44 CA3)" -Detail $r6 -ExpectedCodes @(422) -ExpectedMessageContains "propia solicitud"

# 7. Entrega de reserva en estado PENDIENTE bloqueada (HU33 CA1)
# Creamos una reserva nueva (estado PENDIENTE)
$rRes = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    alumnoId = 4
    creadaPorId = 3
    items = @(
        @{ productoId = 1; cantidad = 1 }
    )
}
if ($rRes.StatusCode -ne 201) {
    Write-Host "  [WARN] No se pudo crear reserva nueva para E07 (Status $($rRes.StatusCode))" -ForegroundColor Yellow
}
$reservaPendId = if ($rRes.Body.id) { $rRes.Body.id } else { 1 }

# Intento de entregar directamente sin preparar
$r7 = Invoke-Api -Method POST -Endpoint "/api/reservas/$reservaPendId/entregar" -Body @{
    encargadoId = 2
}
Check-Edge -Num "E07" -Title "Bloqueo de entrega de reserva en estado PENDIENTE (HU33 CA1)" -Detail $r7 -ExpectedCodes @(422) -ExpectedMessageContains "lista para entrega"

# 8. Devolución de más ítems de los entregados bloqueada (Invariante Devolución)
$r8 = Invoke-Api -Method POST -Endpoint "/api/devoluciones" -Body @{
    entregaId = 1
    encargadoId = 2
    motivo = "Intento devolver exceso"
    items = @(
        @{ detalleEntregaId = 1; cantidad = 9999 }
    )
}
Check-Edge -Num "E08" -Title "Invariante de Devolución: Rechazo al devolver más de lo entregado" -Detail $r8 -ExpectedCodes @(422) -ExpectedMessageContains "excede"

# 9. Cancelación por Apoderado de reserva LISTA_PARA_RETIRO bloqueada (HU28 vs HU32)
# Preparamos la reserva para que pase a LISTA_PARA_RETIRO
$null = Invoke-Api -Method POST -Endpoint "/api/reservas/$reservaPendId/marcar-lista" -Body @{
    encargadoId = 2
}
# Apoderado intenta cancelar
$r9 = Invoke-Api -Method POST -Endpoint "/api/reservas/$reservaPendId/cancelar" -Body @{
    motivo = "Cancelacion tardia por apoderado"
    usuarioId = 3
    rol = "ROLE_APODERADO"
}
Check-Edge -Num "E09" -Title "HU28: Bloqueo a Apoderado de cancelar reserva LISTA_PARA_RETIRO" -Detail $r9 -ExpectedCodes @(422) -ExpectedMessageContains "cancelar reservas en estado PENDIENTE"

# 10. Cancelación de reserva ya ENTREGADA bloqueada
# Entregamos la reserva
$null = Invoke-Api -Method POST -Endpoint "/api/reservas/$reservaPendId/entregar" -Body @{
    encargadoId = 2
}
$r10 = Invoke-Api -Method POST -Endpoint "/api/reservas/$reservaPendId/cancelar" -Body @{
    motivo = "Intento cancelar despues de entregar"
    usuarioId = 2
    rol = "ROLE_ENCARGADO"
}
Check-Edge -Num "E10" -Title "Invariante de Reserva: Rechazo al cancelar reserva ya ENTREGADA" -Detail $r10 -ExpectedCodes @(422) -ExpectedMessageContains "no se puede cancelar"

# 11. Desvincular único apoderado activo de un alumno bloqueado (HU12 CA3)
$r11 = Invoke-Api -Method DELETE -Endpoint "/api/usuarios/alumnos/4/apoderados/3?motivo=PruebaBorde"
Check-Edge -Num "E11" -Title "HU12 CA3: Bloqueo de desvinculación de único apoderado activo" -Detail $r11 -ExpectedCodes @(409, 422) -ExpectedMessageContains "apoderado"

# 12. Creación de reserva autónoma por alumna menor de 12 años bloqueada (HU24/HU26)
$r12 = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    alumnoId = 5 # Sofía (9 años)
    creadaPorId = 5 # Reservando ella misma
    items = @(
        @{ productoId = 1; cantidad = 1 }
    )
}
Check-Edge -Num "E12" -Title "HU24/HU26: Bloqueo de reserva autónoma a menor de 12 años" -Detail $r12 -ExpectedCodes @(422) -ExpectedMessageContains "12"

# 13. Bloqueo de confirmación de abono Webpay con token falso o inexistente (HU21)
$r13 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/confirmar" -Body @{
    token = "TOKEN-HACKER-FALSO-9999"
}
Check-Edge -Num "E13" -Title "HU21: Bloqueo de confirmación de abono con token falso o inexistente" -Detail $r13 -ExpectedCodes @(400, 422) -ExpectedMessageContains "token"

# 14. Inactivación de categoría con productos asociados bloqueada
$r14 = Invoke-Api -Method DELETE -Endpoint "/api/categorias/1"
Check-Edge -Num "E14" -Title "Bloqueo de inactivación de categoría con productos asociados" -Detail $r14 -ExpectedCodes @(400, 422) -ExpectedMessageContains "productos asociados"

# 15. Aislamiento multi-tenant: Operación cruzada entre colegios bloqueada
$r15 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/iniciar" -Body @{
    alumnoId = 9 # Alumno de Colegio 2
    apoderadoId = 3 # Apoderado de Colegio 1
    monto = 5000
}
Check-Edge -Num "E15" -Title "Aislamiento Multi-tenant: Bloqueo de operaciones cruzadas entre colegios distintos" -Detail $r15 -ExpectedCodes @(422, 404) -ExpectedMessageContains "nculo"

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO CASOS DE BORDE: $Passed PASARON | $Failed FALLARON" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan

exit $Failed
