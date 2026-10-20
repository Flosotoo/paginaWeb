<#
 =============================================================================
 Propósito: Realiza un FRESH START completo de las bases de datos de EduSaldo.
            Detiene procesos previos en 8090-8094 para evitar bloqueos de
            metadata lock en MySQL, elimina bases de datos obsoletas y recrea
            limpiamente los 4 esquemas canónicos (db_usuarios, db_saldos,
            db_inventario, db_reservas) verificando las Foreign Keys activas
            para el Diseñador de phpMyAdmin.
 Ejecución: .\backend\scripts\reset_bases_datos.ps1
 =============================================================================
#>

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)
if (-not (Test-Path "$RootDir\edusaldo-api-gateway")) {
    $RootDir = Split-Path -Parent $ScriptDir
}

$MysqlExe = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path $MysqlExe)) {
    $MysqlExe = "mysql"
}

Write-Host "=============================================================================" -ForegroundColor Cyan
Write-Host "  EDUSALDO - REINICIO LIMPIO (FRESH START) DE BASES DE DATOS" -ForegroundColor Cyan
Write-Host "=============================================================================" -ForegroundColor Cyan

# Liberar conexiones JDBC activas en puertos 8090..8094 para evitar metadata lock en DROP DATABASE
foreach ($port in @(8090, 8091, 8092, 8093, 8094)) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
        if ($c.OwningProcess -gt 0) {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
}

$LegacyDbs = @(
    "db_alumnos_saldos",
    "db_productos_inventario",
    "db_auth_usuarios",
    "db_ventas_reservas",
    "db_compras",
    "db_finanzas_config"
)

$Schemas = @(
    @{ Name = "db_usuarios"; Sql = "$RootDir\edusaldo-ms-auth-usuarios\src\main\resources\schema.sql" },
    @{ Name = "db_saldos"; Sql = "$RootDir\edusaldo-ms-alumnos-saldos\src\main\resources\schema.sql" },
    @{ Name = "db_inventario"; Sql = "$RootDir\edusaldo-ms-productos-inventario\src\main\resources\schema.sql" },
    @{ Name = "db_reservas"; Sql = "$RootDir\edusaldo-ms-ventas-reservas\src\main\resources\schema.sql" }
)

Write-Host "[1/4] Limpiando esquemas obsoletos y recreando canónicos..." -ForegroundColor Yellow
$CleanSql = ""
foreach ($db in $LegacyDbs) {
    $CleanSql += "DROP DATABASE IF EXISTS $db;`n"
}
foreach ($s in $Schemas) {
    $CleanSql += "DROP DATABASE IF EXISTS $($s.Name);`nCREATE DATABASE $($s.Name) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`n"
}

& $MysqlExe -h 127.0.0.1 -u root -e $CleanSql
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Falló la recreación de esquemas en MySQL." -ForegroundColor Red
    exit 1
}

Write-Host "[2/4] Cargando schema.sql y seeds iniciales..." -ForegroundColor Yellow
foreach ($s in $Schemas) {
    if (Test-Path $s.Sql) {
        Get-Content $s.Sql -Raw -Encoding UTF8 | & $MysqlExe -h 127.0.0.1 -u root --default-character-set=utf8mb4 $($s.Name)
        if ($LASTEXITCODE -ne 0) {
            Write-Host "      [ERROR] Fallo al ejecutar $($s.Sql)" -ForegroundColor Red
            exit 1
        }
        Write-Host "      [OK] $($s.Name) poblada desde $(Split-Path $s.Sql -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "      [AVISO] Archivo no encontrado: $($s.Sql)" -ForegroundColor Red
    }
}

Write-Host "[3/4] Resumen de tablas y datos iniciales creados:" -ForegroundColor Yellow
$SummarySql = @"
SELECT 'db_usuarios' AS 'Base de Datos', count(*) AS 'Registros Iniciales' FROM db_usuarios.usuarios
UNION ALL
SELECT 'db_saldos', count(*) FROM db_saldos.cuentas_saldo
UNION ALL
SELECT 'db_inventario', count(*) FROM db_inventario.productos
UNION ALL
SELECT 'db_reservas', count(*) FROM db_reservas.reservas;
"@
& $MysqlExe -h 127.0.0.1 -u root -e $SummarySql

Write-Host "`n[4/4] Verificación de Integridad Referencial (Foreign Keys para phpMyAdmin Designer):" -ForegroundColor Yellow
$FkSql = @"
SELECT TABLE_SCHEMA AS 'Esquema',
       TABLE_NAME AS 'Tabla Hija',
       COLUMN_NAME AS 'Columna FK',
       CONSTRAINT_NAME AS 'Restriccion FK',
       REFERENCED_TABLE_NAME AS 'Tabla Padre'
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA IN ('db_usuarios', 'db_saldos', 'db_inventario', 'db_reservas')
ORDER BY TABLE_SCHEMA, TABLE_NAME;
"@
& $MysqlExe -h 127.0.0.1 -u root -e $FkSql

Write-Host "`n[OK] FRESH START Y VERIFICACION DE FOREIGN KEYS COMPLETADOS EXITOSAMENTE." -ForegroundColor Green
