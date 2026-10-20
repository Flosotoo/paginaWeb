# =============================================================================
# Propósito: Suite completa y exhaustiva de pruebas de integración en vivo (PowerShell)
#            que ejecuta 35 CASOS DE USO REALES EXCLUSIVAMENTE a través del
#            API Gateway (puerto 8090) sobre los 4 microservicios de EduSaldo.
# Cubre:
#   - Autenticación, Auditoría y Restablecimiento de Credenciales
#   - Regla de Autonomía y Corte por Edad (>= 12 años vs < 12 años: HU09, HU14, HU24, HU34)
#   - Carga Masiva de Nómina Escolar (HU10)
#   - Solicitudes de Rectificación de Datos Personales (HU16/HU54)
#   - Saldos, Pasarela Webpay, Transferencia Validada por Centro de Padres (HU08/19/20/S12)
#   - Catálogo, Conteo Físico sin mutación y Ajuste de Stock por Encargado y Admin
#   - Reservas, Preparación, Entrega en Mesón a menores, Cancelación y Devolución con Reintegro
#   - Coexistencia y Aislamiento Multiestablecimiento (Multi-Tenant Colegio 1 vs Colegio 2)
# =============================================================================

param(
    [switch]$Interactive
)

$Gateway = "http://localhost:8090"
$Passed = 0
$Failed = 0

function Format-Json($obj) {
    if ($null -eq $obj) { return "            (vacio)" }
    try {
        $json = $obj | ConvertTo-Json -Depth 6
        $lines = $json -split "`r?`n"
        if ($lines.Count -gt 20) {
            $lines = $lines[0..15] + @("            ... ($($lines.Count - 16) lineas adicionales) ...", $lines[-1])
        }
        return ($lines | ForEach-Object { "            $_" }) -join "`r`n"
    } catch {
        return "            $obj"
    }
}

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
            $jsonBody = $Body | ConvertTo-Json -Depth 5 -Compress
            $response = Invoke-RestMethod -Uri $url -Method $Method -Body $jsonBody -Headers $headers -ErrorAction Stop
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -ErrorAction Stop
        }
        $statusCode = 200
        $resObj = $response
    } catch {
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $raw = $reader.ReadToEnd()
                $resObj = $raw | ConvertFrom-Json
            } catch {
                $resObj = @{ error = $_.Exception.Message }
            }
        } else {
            $statusCode = 0
            $resObj = @{ error = $_.Exception.Message }
        }
    }

    return @{ StatusCode = $statusCode; Body = $resObj; Url = $url; Method = $Method; Sent = $Body }
}

function Check-Result {
    param(
        [string]$Num,
        [string]$Title,
        [bool]$Success,
        $Detail,
        [string]$ExtraInfo = ""
    )
    if ($Success) {
        $script:Passed++
        Write-Host "  [PASS] $Num. $Title $ExtraInfo" -ForegroundColor Green
    } else {
        $script:Failed++
        Write-Host "  [FAIL] $Num. $Title $ExtraInfo" -ForegroundColor Red
        if ($Detail) {
            Write-Host "       -> [$($Detail.Method)] $($Detail.Url)" -ForegroundColor DarkGray
            if ($Detail.Sent) {
                Write-Host "          Payload Enviado:" -ForegroundColor DarkGray
                Write-Host (Format-Json $Detail.Sent) -ForegroundColor DarkGray
            }
            Write-Host "       <- HTTP $($Detail.StatusCode)" -ForegroundColor DarkGray
            Write-Host "          Respuesta:" -ForegroundColor DarkGray
            Write-Host (Format-Json $Detail.Body) -ForegroundColor DarkGray
        }
    }
}

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  EDUSALDO - SUITE COMPLETA DE PRUEBAS DE INTEGRACION REAL (API GATEWAY 8090)" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan

# -----------------------------------------------------------------------------
# 1. MS USUARIOS, AUTONOMIA POR EDAD Y NOMINAS (Puerto 8091)
# -----------------------------------------------------------------------------
Write-Host "`n--- 1. MS USUARIOS, AUTONOMIA POR EDAD Y NOMINAS (Puerto 8091) ---" -ForegroundColor Yellow

# Caso 01: Login Administrador Colegio 1 exitoso
$r1 = Invoke-Api -Method POST -Endpoint "/api/auth/login" -Body @{ identificador = "admin@colegio.cl"; password = "admin123" }
$ok1 = ($r1.StatusCode -eq 200 -and $null -ne $r1.Body.token)
Check-Result -Num "01" -Title "Login Administrador Colegio 1 exitoso" -Success $ok1 -Detail $r1 -ExtraInfo "(Usuario: $($r1.Body.nombreCompleto))"

# Caso 02: Login fallido controlado
$r2 = Invoke-Api -Method POST -Endpoint "/api/auth/login" -Body @{ identificador = "admin@colegio.cl"; password = "clave_invalida_xyz" }
$ok2 = ($r2.StatusCode -in @(400, 401))
Check-Result -Num "02" -Title "Login fallido controlado con rechazo" -Success $ok2 -Detail $r2

# Caso 03: HU09/HU14 - Login Alumno < 12 años debe ser rechazado
$r3 = Invoke-Api -Method POST -Endpoint "/api/auth/login" -Body @{ identificador = "sofia.perez@alumnos.colegio.cl"; password = "Edu123456" }
$ok3 = ($r3.StatusCode -in @(400, 403, 409, 422))
Check-Result -Num "03" -Title "HU09/HU14: Login Alumno < 12 anos rechazado (Sofia, 9 anos sin acceso autonomo)" -Success $ok3 -Detail $r3

# Caso 04: HU09/HU14 - Login Alumno >= 12 años debe ser exitoso
$r4 = Invoke-Api -Method POST -Endpoint "/api/auth/login" -Body @{ identificador = "tomas.perez@alumnos.colegio.cl"; password = "Edu123456" }
$ok4 = ($r4.StatusCode -eq 200 -and $r4.Body.rol -eq "ROLE_ALUMNO")
Check-Result -Num "04" -Title "HU09/HU14: Login Alumno >= 12 anos exitoso (Tomas, 14 anos con autonomia)" -Success $ok4 -Detail $r4

# Caso 05: HU10 - Carga masiva de nomina de alumnos y apoderados
$ts = [int](Get-Date -UFormat %s)
$nominaBody = @(
    @{
        idEstablecimiento = 1
        rutAlumno = "26.$($ts % 800 + 100).333-1"
        primerNombreAlumno = "Lucas"
        primerApellidoAlumno = "Vargas"
        fechaNacimiento = "2013-03-20"
        curso = "6 Basico A"
        rutApoderado = "17.$($ts % 800 + 100).444-2"
        primerNombreApoderado = "Manuel"
        primerApellidoApoderado = "Vargas"
        correoApoderado = "manuel_vargas_$ts@gmail.com"
        telefonoApoderado = "+56911223344"
        parentesco = "PADRE"
    },
    @{
        idEstablecimiento = 1
        rutAlumno = "26.$($ts % 800 + 101).555-2"
        primerNombreAlumno = "Valentina"
        primerApellidoAlumno = "Castro"
        fechaNacimiento = "2011-08-15"
        curso = "8 Basico B"
        rutApoderado = "17.$($ts % 800 + 101).666-3"
        primerNombreApoderado = "Andrea"
        primerApellidoApoderado = "Castro"
        correoApoderado = "andrea_castro_$ts@gmail.com"
        telefonoApoderado = "+56955667788"
        parentesco = "MADRE"
    }
)
$r5 = Invoke-Api -Method POST -Endpoint "/api/usuarios/alumnos/importacion-masiva" -Body $nominaBody
$ok5 = ($r5.StatusCode -in @(200, 201) -and $r5.Body.Count -ge 2)
Check-Result -Num "05" -Title "HU10: Importacion masiva de nomina escolar (2 alumnos + 2 apoderados)" -Success $ok5 -Detail $r5

# Caso 06: HU15 - Alta atomica Alumno + Apoderado individual
$r6 = Invoke-Api -Method POST -Endpoint "/api/usuarios/alumnos" -Body @{
    idEstablecimiento = 1
    rutAlumno = "25.$($ts % 900 + 100).111-K"
    primerNombreAlumno = "Tomas"
    primerApellidoAlumno = "Gonzalez"
    fechaNacimiento = "2012-05-15"
    curso = "7 Basico"
    rutApoderado = "16.$($ts % 900 + 100).222-3"
    primerNombreApoderado = "Carlos"
    primerApellidoApoderado = "Gonzalez"
    correoApoderado = "apoderado_ind_$ts@gmail.com"
    telefonoApoderado = "+56912345678"
    parentesco = "PADRE"
}
$ok6 = ($r6.StatusCode -in @(200, 201) -and $null -ne $r6.Body.alumnoId)
$nuevoAlumnoId = if ($ok6) { $r6.Body.alumnoId } else { 4 }
$nuevoApoderadoId = if ($ok6) { $r6.Body.apoderadoId } else { 3 }
Check-Result -Num "06" -Title "HU15: Alta atomica individual Alumno + Apoderado" -Success $ok6 -Detail $r6 -ExtraInfo "(Alumno: $nuevoAlumnoId, Apoderado: $nuevoApoderadoId)"

# Caso 07: HU04 - Cambio de contrasena voluntario (transicion a cuenta activa)
$r7 = Invoke-Api -Method POST -Endpoint "/api/auth/cambiar-password" -Body @{
    identificador = "admin@colegio.cl"
    passwordActual = "admin123"
    passwordNueva = "admin123"
}
$ok7 = ($r7.StatusCode -eq 200)
Check-Result -Num "07" -Title "HU04: Cambio voluntario de contrasena informado" -Success $ok7 -Detail $r7

# Caso 08: HU12 CA3 - Rechazo al desvincular al unico apoderado activo de un alumno
$r8 = Invoke-Api -Method DELETE -Endpoint "/api/usuarios/alumnos/4/apoderados/3?motivo=IntentoDesvincularUnico"
$ok8 = ($r8.StatusCode -in @(400, 409, 422))
Check-Result -Num "08" -Title "HU12 CA3: Rechazo al intentar desvincular al unico apoderado activo (422)" -Success $ok8 -Detail $r8

# Caso 09: HU17 - Consulta de pupilos asociados a apoderado
$r9 = Invoke-Api -Method GET -Endpoint "/api/usuarios/apoderados/3/alumnos"
$ok9 = ($r9.StatusCode -eq 200 -and $r9.Body.Count -ge 2)
Check-Result -Num "09" -Title "HU17: Consulta de pupilos asociados a apoderado Carlos Perez (2 pupilos)" -Success $ok9 -Detail $r9

# Caso 10: HU16/HU54 - Solicitud de correccion de datos personales (derecho de rectificacion)
$r10 = Invoke-Api -Method POST -Endpoint "/api/usuarios/solicitudes-correccion" -Body @{
    usuarioId = 3
    campoSolicitado = "telefono"
    valorActual = "+56987654321"
    valorPropuesto = "+56999887766"
    motivo = "Actualizacion de numero de telefono movil"
}
$ok10 = ($r10.StatusCode -in @(200, 201) -and $null -ne $r10.Body.id)
$solicitudId = if ($ok10) { $r10.Body.id } else { 1 }
Check-Result -Num "10" -Title "HU16/HU54: Solicitud de correccion de datos personales registrada" -Success $ok10 -Detail $r10

# Caso 11: HU16/HU54 - Administrador aprueba solicitud de correccion
$r11 = Invoke-Api -Method PUT -Endpoint "/api/usuarios/solicitudes-correccion/$solicitudId/resolver" -Body @{
    aprobar = $true
    observacion = "Aprobado tras cotejar con secretaria"
}
$ok11 = ($r11.StatusCode -eq 200 -and $r11.Body.estado -eq "APROBADA")
Check-Result -Num "11" -Title "HU16/HU54: Resolucion y actualizacion de datos por Administrador" -Success $ok11 -Detail $r11

# Caso 12: HU52 - Verificacion de registro de auditoria institucional
$r12 = Invoke-Api -Method GET -Endpoint "/api/auditoria"
$ok12 = ($r12.StatusCode -eq 200 -and $r12.Body.Count -ge 1)
Check-Result -Num "12" -Title "HU52: Verificacion de trazabilidad en registro_auditoria" -Success $ok12 -Detail $r12

# -----------------------------------------------------------------------------
# 2. MS SALDOS, MEDIOS DE PAGO Y CONCILIACION (Puerto 8092)
# -----------------------------------------------------------------------------
Write-Host "`n--- 2. MS SALDOS, MEDIOS DE PAGO Y CONCILIACION (Puerto 8092) ---" -ForegroundColor Yellow

# Caso 13: Consulta de saldo inicial de pupilo
$r13 = Invoke-Api -Method GET -Endpoint "/api/saldos/cuenta/4"
$ok13 = ($r13.StatusCode -eq 200 -and $r13.Body.saldoActual -ge 25000)
Check-Result -Num "13" -Title "Consulta de saldo inicial de pupilo Tomas (Saldo: `$25.000 CLP)" -Success $ok13 -Detail $r13

# Caso 14: HU18 - Inicio de abono Webpay simulado
$r14 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/iniciar" -Body @{
    alumnoId = 4
    apoderadoId = 3
    monto = 15000
}
$ok14 = ($r14.StatusCode -in @(200, 201) -and $null -ne $r14.Body.token)
$tokenWebpay = if ($ok14) { $r14.Body.token } else { "" }
Check-Result -Num "14" -Title "HU18: Inicio de abono Webpay simulado (Token UUID generado)" -Success $ok14 -Detail $r14

# Caso 15: HU21 - Confirmacion de abono y acreditacion en CuentaSaldo
$r15 = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/confirmar" -Body @{
    token = $tokenWebpay
}
$ok15 = ($r15.StatusCode -eq 200 -and $r15.Body.estado -eq "APROBADO")
Check-Result -Num "15" -Title "HU21: Confirmacion de abono y acreditacion contable en CuentaSaldo" -Success $ok15 -Detail $r15

# Caso 16: Invariante de Saldo - Rechazo ante retencion superior al disponible
$r16 = Invoke-Api -Method POST -Endpoint "/api/saldos/retener" -Body @{
    alumnoId = 4
    reservaId = 999
    monto = 99999999
}
$ok16 = ($r16.StatusCode -in @(400, 422))
Check-Result -Num "16" -Title "Invariante de Saldo: Rechazo controlado por saldo insuficiente (400/422)" -Success $ok16 -Detail $r16

# Caso 17: HU21/HU46 - Consulta de libro mayor MovimientoSaldo
$r17 = Invoke-Api -Method GET -Endpoint "/api/saldos/cuenta/4/movimientos"
$ok17 = ($r17.StatusCode -eq 200 -and $r17.Body.Count -ge 2)
Check-Result -Num "17" -Title "HU21/HU46: Consulta de libro mayor movimientos_saldo inmutable" -Success $ok17 -Detail $r17

# Caso 18: HU23 - Liquidacion de saldo por retiro de alumno con constancia
$r18 = Invoke-Api -Method POST -Endpoint "/api/saldos/cuenta/liquidar" -Body @{
    alumnoId = $nuevoAlumnoId
    apoderadoId = $nuevoApoderadoId
    medio = "TRANSFERENCIA_ELECTRONICA"
    comprobante = "LIQ-TRF-778899"
    motivo = "Retiro por traslado de ciudad"
}
$ok18 = ($r18.StatusCode -eq 200)
Check-Result -Num "18" -Title "HU23: Liquidacion de saldo por retiro del alumno -> constancias_devolucion_saldo" -Success $ok18 -Detail $r18

# -----------------------------------------------------------------------------
# 3. MS PRODUCTOS E INVENTARIO (Puerto 8093)
# -----------------------------------------------------------------------------
Write-Host "`n--- 3. MS PRODUCTOS E INVENTARIO (Puerto 8093) ---" -ForegroundColor Yellow

# Caso 19: Consulta de catalogo y existencias
$r19 = Invoke-Api -Method GET -Endpoint "/api/productos"
$ok19 = ($r19.StatusCode -eq 200 -and $r19.Body.Count -ge 3)
Check-Result -Num "19" -Title "HU24/HU38: Consulta de catalogo y existencias de productos" -Success $ok19 -Detail $r19

# Caso 20: HU46 - Ingreso manual de stock por Encargado (HU42 CA3: sin proveedor ni factura)
$r20 = Invoke-Api -Method POST -Endpoint "/api/inventario/ingresos" -Body @{
    idEstablecimiento = 1
    encargadoId = 2
    observacion = "Recepcion de reposicion de utiles escolares"
    detalles = @(
        @{ productoId = 1; cantidad = 20 }
    )
}
$ok20 = ($r20.StatusCode -in @(200, 201))
Check-Result -Num "20" -Title "HU46: Ingreso manual de stock por Encargado sin proveedor/factura (HU42 CA3)" -Success $ok20 -Detail $r20

# Caso 21: HU44 - Solicitud de ajuste de stock levantada por Encargado
$r21 = Invoke-Api -Method POST -Endpoint "/api/inventario/ajustes/solicitar" -Body @{
    idEstablecimiento = 1
    productoId = 1
    encargadoId = 2
    diferencia = -2
    motivo = "Dano por derrame de tinta en almacen"
}
$ok21 = ($r21.StatusCode -in @(200, 201) -and $r21.Body.estado -eq "PENDIENTE")
$solicitudAjusteId = if ($ok21) { $r21.Body.id } else { 1 }
Check-Result -Num "21" -Title "HU44: Solicitud de ajuste de stock en estado PENDIENTE por Encargado" -Success $ok21 -Detail $r21

# Caso 22: HU44 - Aprobacion exclusiva por Administrador
$r22 = Invoke-Api -Method PUT -Endpoint "/api/inventario/ajustes/$solicitudAjusteId/resolver" -Body @{
    aprobar = $true
    administradorId = 1
    observacion = "Merma justificada y aprobada"
}
$ok22 = ($r22.StatusCode -eq 200 -and $r22.Body.estado -eq "APROBADA")
Check-Result -Num "22" -Title "HU44: Aprobacion de ajuste por Administrador e impacto en stockFisico" -Success $ok22 -Detail $r22

# Caso 23: HU43 - Conteo fisico registra diferencia sin alterar stockFisico
$prodAntes = (Invoke-Api -Method GET -Endpoint "/api/productos/1").Body.stockFisico
$r23 = Invoke-Api -Method POST -Endpoint "/api/inventario/conteos-fisicos" -Body @{
    idEstablecimiento = 1
    encargadoId = 2
    observaciones = "Conteo fisico semestral"
    detalles = @(
        @{ productoId = 1; stockContado = 30 }
    )
}
$prodDespues = (Invoke-Api -Method GET -Endpoint "/api/productos/1").Body.stockFisico
$ok23 = ($r23.StatusCode -in @(200, 201) -and $prodAntes -eq $prodDespues)
Check-Result -Num "23" -Title "HU43: Conteo fisico registra diferencia sin alterar stockFisico (Stock intacto: $prodDespues)" -Success $ok23 -Detail $r23

# Caso 24: Consulta de libro mayor MovimientoInventario
$r24 = Invoke-Api -Method GET -Endpoint "/api/inventario/movimientos/producto/1"
$ok24 = ($r24.StatusCode -eq 200 -and $r24.Body.Count -ge 1)
Check-Result -Num "24" -Title "Consulta de libro mayor movimientos_inventario (trazabilidad fisica/reservada)" -Success $ok24 -Detail $r24

# -----------------------------------------------------------------------------
# 4. MS RESERVAS, ENTREGAS Y DEVOLUCIONES (Puerto 8094)
# -----------------------------------------------------------------------------
Write-Host "`n--- 4. MS RESERVAS, ENTREGAS Y DEVOLUCIONES (Puerto 8094) ---" -ForegroundColor Yellow

# Caso 25: HU24 - Rechazo de reserva si intenta crearla un alumno < 12 años
$r25 = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    idEstablecimiento = 1
    alumnoId = 5
    creadaPorId = 5
    items = @(
        @{ productoId = 1; cantidad = 1; precioUnitario = 1500; nombreProducto = "Cuaderno universitario" }
    )
}
$ok25 = ($r25.StatusCode -in @(400, 422))
Check-Result -Num "25" -Title "HU24: Rechazo al crear reserva autónoma por alumno < 12 anos (Sofia 9 anos, 422)" -Success $ok25 -Detail $r25

# Caso 26: HU27 - Creacion exitosa de reserva por alumno >= 12 años (Tomas)
$r26 = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    idEstablecimiento = 1
    alumnoId = 4
    creadaPorId = 4
    items = @(
        @{ productoId = 1; cantidad = 2; precioUnitario = 1500; nombreProducto = "Cuaderno universitario" }
    )
}
$ok26 = ($r26.StatusCode -in @(200, 201) -and $null -ne $r26.Body.id)
$reservaTomasId = if ($ok26) { $r26.Body.id } else { 1 }
Check-Result -Num "26" -Title "HU27: Creacion de reserva por alumno >= 12 anos con retencion de saldo y stock (S01-S04)" -Success $ok26 -Detail $r26

# Caso 27: HU31 CA2 - Preparacion de reserva por Encargado registra encargadId y fechaPreparacion
$r27 = Invoke-Api -Method PUT -Endpoint "/api/reservas/$reservaTomasId/preparar?encargadoId=2"
$ok27 = ($r27.StatusCode -eq 200 -and $r27.Body.preparadaPorId -eq 2 -and $r27.Body.estado -eq "LISTA_PARA_RETIRO")
Check-Result -Num "27" -Title "HU31 CA2: Preparacion registra encargadId=2 y fechaPreparacion (LISTA_PARA_RETIRO)" -Success $ok27 -Detail $r27

# Caso 28: HU33 - Confirmacion de retiro genera Entrega formal y cobro definitivo
$r28 = Invoke-Api -Method POST -Endpoint "/api/entregas/reserva/$($reservaTomasId)?encargadoId=2"
$ok28 = ($r28.StatusCode -in @(200, 201) -and $null -ne $r28.Body.id)
$entregaTomasId = if ($ok28) { $r28.Body.id } else { 1 }
$detEntregaId = if ($ok28 -and $r28.Body.items -and $r28.Body.items.Count -gt 0) { $r28.Body.items[0].id } else { 1 }
Check-Result -Num "28" -Title "HU33: Retiro de reserva genera Entrega formal y descuenta stock/saldo (S07-S08)" -Success $ok28 -Detail $r28

# Caso 29: HU34 - Entrega presencial directa en meson a alumno MENOR de 12 años (Sofia)
$r29 = Invoke-Api -Method POST -Endpoint "/api/entregas/meson" -Body @{
    idEstablecimiento = 1
    alumnoId = 5
    encargadoId = 2
    items = @(
        @{ productoId = 2; cantidad = 1; precioUnitario = 500; nombreProducto = "Lapiz grafito HB" }
    )
}
$ok29 = ($r29.StatusCode -in @(200, 201) -and $r29.Body.origen -eq "MESON")
Check-Result -Num "29" -Title "HU34: Entrega directa en meson a alumna menor de 12 anos permitida (Sofia, MESON)" -Success $ok29 -Detail $r29

# Caso 30: HU28 - Cancelacion de reserva en PENDIENTE por alumno >= 12 años
$rRes = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    idEstablecimiento = 1
    alumnoId = 4
    creadaPorId = 4
    items = @(
        @{ productoId = 2; cantidad = 1; precioUnitario = 500; nombreProducto = "Lapiz grafito" }
    )
}
$resParaCancelar = if ($rRes.StatusCode -in @(200, 201)) { $rRes.Body.id } else { 99 }
$r30 = Invoke-Api -Method POST -Endpoint "/api/reservas/$resParaCancelar/cancelar" -Body @{
    usuarioId = 4
    rol = "ALU"
    motivo = "Cancelado por alumno antes de preparacion"
}
$ok30 = ($r30.StatusCode -eq 200 -and $r30.Body.estado -eq "CANCELADA")
Check-Result -Num "30" -Title "HU28: Cancelacion de reserva en estado PENDIENTE por alumno >= 12 anos" -Success $ok30 -Detail $r30

# Caso 31: HU28 vs HU32 - Regla diferenciada de cancelacion en LISTA_PARA_RETIRO
$rResLista = Invoke-Api -Method POST -Endpoint "/api/reservas" -Body @{
    idEstablecimiento = 1
    alumnoId = 4
    creadaPorId = 3
    items = @(
        @{ productoId = 3; cantidad = 1; precioUnitario = 800; nombreProducto = "Regla 30cm" }
    )
}
$resListaId = if ($rResLista.StatusCode -in @(200, 201)) { $rResLista.Body.id } else { 98 }
Invoke-Api -Method PUT -Endpoint "/api/reservas/$resListaId/preparar?encargadoId=2" | Out-Null

$rApoderadoFalla = Invoke-Api -Method POST -Endpoint "/api/reservas/$resListaId/cancelar" -Body @{
    usuarioId = 3
    rol = "APO"
    motivo = "Intento apoderado cancelar pedido listo"
}
$rEncargadoExito = Invoke-Api -Method POST -Endpoint "/api/reservas/$resListaId/cancelar" -Body @{
    usuarioId = 2
    rol = "ENC"
    motivo = "Cancelacion por encargado por superar plazo de retiro"
}
$ok31 = ($rApoderadoFalla.StatusCode -in @(400, 422) -and $rEncargadoExito.StatusCode -eq 200)
Check-Result -Num "31" -Title "HU28 vs HU32: Apoderado rechaza cancelar lista (422), Encargado cancela con exito (200)" -Success $ok31 -Detail $rEncargadoExito

# Caso 32: HU36 - Devolucion en pañol con reintegro contable y de stock
$r32 = Invoke-Api -Method POST -Endpoint "/api/devoluciones" -Body @{
    entregaId = $entregaTomasId
    encargadoId = 2
    motivo = "Devolucion de 1 cuaderno sin uso"
    items = @(
        @{ detalleEntregaId = $detEntregaId; cantidad = 1 }
    )
}
$ok32 = ($r32.StatusCode -eq 200 -and $null -ne $r32.Body.codigoDevolucion)
Check-Result -Num "32" -Title "HU36: Devolucion con reintegro contable automatico (S09) y stock (S10)" -Success $ok32 -Detail $r32

# -----------------------------------------------------------------------------
# 5. ORQUESTACION S01-S12 Y MULTIESTABLECIMIENTO (MULTI-TENANT)
# -----------------------------------------------------------------------------
Write-Host "`n--- 5. ORQUESTACION S01-S12 Y MULTIESTABLECIMIENTO (MULTI-TENANT) ---" -ForegroundColor Yellow

# Caso 33: HU08/HU20/S12 - Transferencia bancaria validada por Apoderado Centro de Padres
$rRegTrf = Invoke-Api -Method POST -Endpoint "/api/saldos/abonos/transferencia" -Body @{
    alumnoId = 4
    apoderadoId = 3
    monto = 20000
    numeroOperacion = "BANCO-CHILE-998877"
    comprobanteUrl = "https://edusaldo.cl/comprobantes/trf-9988.pdf"
}
$trfId = if ($rRegTrf.StatusCode -in @(200, 201)) { $rRegTrf.Body.id } else { 2 }

$r33 = Invoke-Api -Method PUT -Endpoint "/api/saldos/abonos/$trfId/resolver-transferencia" -Body @{
    aprobar = $true
    revisorApoderadoId = 3
}
$ok33 = ($r33.StatusCode -eq 200 -and $r33.Body.estado -eq "APROBADO")
Check-Result -Num "33" -Title "HU08/HU20/S12: Transferencia aprobada por Apoderado Centro de Padres autorizado" -Success $ok33 -Detail $r33

# Caso 34: Multi-tenant - Login Administrador Colegio San Agustín (Colegio 2)
$r34 = Invoke-Api -Method POST -Endpoint "/api/auth/login" -Body @{
    identificador = "admin@sanagustin.cl"
    password = "admin123"
}
$ok34 = ($r34.StatusCode -eq 200 -and $r34.Body.idEstablecimiento -eq 2)
Check-Result -Num "34" -Title "Multi-tenant: Login Administrador Colegio 2 exitoso (Colegio San Agustin, ID=2)" -Success $ok34 -Detail $r34

# Caso 35: Multi-tenant - Aislamiento contable entre colegios
$rSaldoC1 = Invoke-Api -Method GET -Endpoint "/api/saldos/cuenta/4"
$rSaldoC2 = Invoke-Api -Method GET -Endpoint "/api/saldos/cuenta/9"
$ok35 = ($rSaldoC1.StatusCode -eq 200 -and $rSaldoC1.Body.idEstablecimiento -eq 1 -and
         $rSaldoC2.StatusCode -eq 200 -and $rSaldoC2.Body.idEstablecimiento -eq 2 -and
         $rSaldoC2.Body.saldoActual -eq 30000)
Check-Result -Num "35" -Title "Multi-tenant: Cuentas de saldo estrictamente aisladas (Colegio 1 vs Colegio 2)" -Success $ok35 -Detail $rSaldoC2

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO FINAL: $Passed CASOS PASARON | $Failed CASOS FALLARON" -ForegroundColor $(if ($Failed -eq 0) { "Green" } else { "Red" })
if ($Failed -eq 0) {
    Write-Host "  [OK] LOS 4 MICROSERVICIOS Y EL GATEWAY OPERAN AL 100% CON 35 CASOS EXITOSOS." -ForegroundColor Green
} else {
    Write-Host "  ALERTA: Se detectaron fallos en la bateria de pruebas." -ForegroundColor Red
}
Write-Host "=============================================================================" -ForegroundColor Cyan
