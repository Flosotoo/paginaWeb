from collections import defaultdict
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'backend'
SERVICES = (
    ('edusaldo-ms-auth-usuarios', 8091, 'db_usuarios'),
    ('edusaldo-ms-alumnos-saldos', 8092, 'db_saldos'),
    ('edusaldo-ms-productos-inventario', 8093, 'db_inventario'),
    ('edusaldo-ms-ventas-reservas', 8094, 'db_reservas'),
    ('edusaldo-api-gateway', 8090, None),
)


def mysql_binary():
    explicit = os.environ.get('EDUSALDO_MYSQL')
    candidates = [explicit] if explicit else ['/opt/lampp/bin/mysql', r'C:\xampp\mysql\bin\mysql.exe', 'mysql']
    for candidate in candidates:
        found = shutil.which(candidate)
        if found:
            return found
    raise RuntimeError('No se encontró el cliente XAMPP. Configura EDUSALDO_MYSQL con su ubicación.')


def mysql(sql, database=None):
    command = [mysql_binary(), '--host=' + os.environ.get('EDUSALDO_DB_HOST', '127.0.0.1'),
               '--port=' + os.environ.get('EDUSALDO_DB_PORT', '3306'),
               '--user=' + os.environ.get('EDUSALDO_DB_USER', 'root'), '--batch', '--skip-column-names']
    if database:
        command.append(database)
    environment = os.environ.copy()
    if os.environ.get('EDUSALDO_DB_PASSWORD'):
        environment['MYSQL_PWD'] = os.environ['EDUSALDO_DB_PASSWORD']
    return subprocess.run(command, input=sql, text=True, capture_output=True,
                          env=environment, check=True)


def configura_validacion(config):
    valores = re.findall(r'(?m)^[ \t]*ddl-auto[ \t]*:[ \t]*([^#\r\n]+)', config)
    return len(valores) == 1 and valores[0].strip().strip("\"'") == 'validate'


def analizar_relaciones(tablas, relaciones):
    errores = []
    vecinos = {tabla: set() for tabla in tablas}
    for origen, destino in relaciones:
        if origen[0] != destino[0]:
            errores.append(f'Relación entre esquemas distintos: {origen} -> {destino}')
        elif origen not in vecinos or destino not in vecinos:
            errores.append(f'Relación con tabla no encontrada: {origen} -> {destino}')
        else:
            vecinos[origen].add(destino)
            vecinos[destino].add(origen)
    grupos = defaultdict(set)
    for tabla in tablas:
        grupos[tabla[0]].add(tabla)
    for esquema, restantes in grupos.items():
        componentes = []
        while restantes:
            visitar = [restantes.pop()]
            componente = set(visitar)
            while visitar:
                for vecino in vecinos[visitar.pop()] & restantes:
                    restantes.remove(vecino)
                    componente.add(vecino)
                    visitar.append(vecino)
            componentes.append(componente)
        if len(componentes) > 1:
            nombres = ['/'.join(sorted(tabla[1] for tabla in grupo)) for grupo in componentes]
            errores.append(f'Tablas aisladas en {esquema}: {", ".join(sorted(nombres))}')
    return errores


def verificar_esquemas():
    esquemas = {db for _, _, db in SERVICES if db}
    nombres = ','.join("'" + db + "'" for db in sorted(esquemas))
    resultado = mysql('SELECT TABLE_SCHEMA,TABLE_NAME FROM information_schema.TABLES '
                      f'WHERE TABLE_SCHEMA IN ({nombres}) AND TABLE_TYPE = "BASE TABLE";')
    tablas = {tuple(line.split('\t')) for line in resultado.stdout.splitlines() if line}
    relaciones = mysql('SELECT TABLE_SCHEMA,TABLE_NAME,REFERENCED_TABLE_SCHEMA,REFERENCED_TABLE_NAME '
                       'FROM information_schema.KEY_COLUMN_USAGE '
                       f'WHERE TABLE_SCHEMA IN ({nombres}) AND REFERENCED_TABLE_NAME IS NOT NULL;')
    aristas = []
    for line in relaciones.stdout.splitlines():
        a, b, c, d = line.split('\t')
        aristas.append(((a, b), (c, d)))
    errores = analizar_relaciones(tablas, aristas)
    for esquema in esquemas - {tabla[0] for tabla in tablas}:
        errores.append(f'No se encontraron tablas en {esquema}')
    for nombre, _, esquema in SERVICES:
        if not esquema:
            continue
        config = BACKEND / nombre / 'src/main/resources/application.yml'
        if not configura_validacion(config.read_text(encoding='utf-8')):
            errores.append(f'{nombre} no valida el esquema existente al arrancar')
    if errores:
        raise RuntimeError('; '.join(errores))
    print(f'[OK] {len(tablas)} tablas en {len(esquemas)} esquemas, '
          f'{len(aristas)} referencias locales; configuración JPA de validación activa.')


def main():
    schemas = [(db, BACKEND / name / 'src/main/resources/schema.sql')
               for name, _, db in SERVICES if db]
    try:
        mysql_binary()
        missing = [str(path) for _, path in schemas if not path.is_file()]
        if missing:
            raise RuntimeError('Faltan esquemas: ' + ', '.join(missing))
        mysql('SELECT VERSION();')
        # Se comprueban todos los recursos antes del primer DROP porque el DDL no es reversible.
        sources = [(db, path.read_text(encoding='utf-8')) for db, path in schemas]
        print('Se reconstruirán exclusivamente: ' + ', '.join(db for db, _ in schemas))
        for db, source in sources:
            mysql(f'DROP DATABASE IF EXISTS `{db}`; CREATE DATABASE `{db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
            mysql(source, db)
            print(f'[OK] {db}')
        summary = mysql("SELECT 'usuarios', COUNT(*) FROM db_usuarios.usuarios UNION ALL "
                        "SELECT 'cuentas', COUNT(*) FROM db_saldos.cuentas_saldo UNION ALL "
                        "SELECT 'productos', COUNT(*) FROM db_inventario.productos UNION ALL "
                        "SELECT 'reservas', COUNT(*) FROM db_reservas.reservas;")
        print(summary.stdout)
        verificar_esquemas()
        print('[OK] Esquemas y semillas reconstruidos.')
        return 0
    except (RuntimeError, OSError, ValueError, subprocess.CalledProcessError) as error:
        detail = error.stderr if isinstance(error, subprocess.CalledProcessError) else str(error)
        print(f'[ERROR] Reconstrucción incompleta o cancelada: {detail}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    sys.exit(main())
