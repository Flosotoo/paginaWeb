#!/usr/bin/env python3
"""Verificación HTTP local. Modifica datos: crea catálogo y realiza movimientos de prueba.

Requiere las semillas locales y servicios reconstruidos. Configure las credenciales
mediante las variables EDUSALDO_*; no se imprimen contraseñas ni tokens.
"""
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parent.parent


def mapping_paths(arguments):
    named = re.search(r'(?:path|value)\s*=\s*(\{[^}]*\}|"[^"]*")', arguments)
    if named:
        return re.findall(r'"([^"]*)"', named.group(1))
    arguments = arguments.strip()
    if arguments.startswith('{'):
        return re.findall(r'"([^"]*)"', arguments.split('}', 1)[0])
    if arguments.startswith('"'):
        return [re.search(r'"([^"]*)"', arguments).group(1)]
    return ['']


def routes():
    found = []
    annotation = re.compile(r'@(Get|Post|Put|Delete|Patch)Mapping\b\s*(?:\(([^)]*)\))?')
    for file in (ROOT / 'backend').glob('*/src/main/java/**/*.java'):
        source = file.read_text(encoding='utf-8')
        if '@RestController' not in source:
            continue
        base = re.search(r'@RequestMapping\s*\(([^)]*)\)', source.split('public class')[0])
        prefixes = mapping_paths(base.group(1)) if base else ['']
        for match in annotation.finditer(source):
            for prefix in prefixes:
                for suffix in mapping_paths(match.group(2) or ''):
                    path = prefix.rstrip('/') + '/' + suffix.lstrip('/')
                    found.append((match.group(1).upper(), path.rstrip('/') or '/', str(file.relative_to(ROOT))))
    return found


def normalize_path(path):
    return re.sub(r'\{[^}]+\}', '{}', path.rstrip('/'))


def hidden_public_mappings(source):
    if '@RestController' not in source:
        return []
    pattern = r'@Hidden\s*(?:@\w+(?:\([^)]*\))?\s*)*?@(?:Get|Post|Put|Delete|Patch)Mapping\s*\(([^)]*)\)'
    return [path for match in re.finditer(pattern, source)
            for path in mapping_paths(match.group(1)) if '/internal/' not in path]


def duplicate_routes(definitions):
    problems = []
    seen = {}
    for method, path, filename in definitions:
        application = Path(filename).parts[1]
        key = application, method, normalize_path(path)
        if key in seen:
            problems.append(f'Mapping duplicado {method} {path}: {seen[key]} / {filename}')
        seen[key] = filename
    return problems


def verificar_contratos():
    definitions = routes()
    problems = duplicate_routes(definitions)
    for file in (ROOT / 'backend').glob('*/src/main/java/**/*.java'):
        source = file.read_text(encoding='utf-8')
        if re.search(r'\b(?:HU\d+|EP\d+)\b|\b[Ss]prints?\s+\d', source):
            problems.append(f'Etiquetas documentales dentro de código: {file.relative_to(ROOT)}')
        for path in hidden_public_mappings(source):
            problems.append(f'Mapping público oculto que debe revisarse: {path} en {file.relative_to(ROOT)}')
    collection = ROOT / 'scripts/pruebas_postman_coleccion.json'
    if collection.exists():
        content = json.loads(collection.read_text(encoding='utf-8'))
        def inspect(items):
            for item in items:
                if 'request' in item:
                    request = item['request']
                    url = request.get('url', '')
                    raw = url.get('raw', '') if isinstance(url, dict) else url
                    path = re.sub(r'^\{\{[^}]+\}\}', '', raw).split('?')[0]
                    path = re.sub(r'\{\{[^}]+\}\}', '{}', path)
                    key = request.get('method'), normalize_path(path)
                    candidates = [route for method, route, _ in definitions if method == key[0]]
                    if not any(re.fullmatch(re.sub(r'\{[^}]+\}', r'[^/]+', candidate), path.rstrip('/')) for candidate in candidates):
                        problems.append(f'Postman sin mapping: {key[0]} {path}')
                inspect(item.get('item', []))
        inspect(content.get('item', []))
        if not content.get('auth'):
            problems.append('Postman no define autenticación de colección.')
    require(not problems, '; '.join(problems))


class CheckFailed(Exception):
    pass


def redact(value):
    def clean(obj):
        if isinstance(obj, dict):
            return {k: ('[oculto]' if any(s in k.lower() for s in ('token', 'password', 'clave', 'authorization')) else clean(v)) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean(v) for v in obj]
        return obj
    return json.dumps(clean(value), ensure_ascii=False)


def require(condition, message):
    if not condition:
        raise CheckFailed(message)


def expect_status(status, expected):
    expected = {expected} if isinstance(expected, int) else set(expected)
    require(status in expected, f'HTTP {status}; esperado {sorted(expected)}')


class Client:
    def __init__(self, base, timeout=15):
        self.base = base.rstrip('/')
        self.timeout = timeout

    def request(self, method, path, data=None, token=None, headers=None):
        hdr = {'Accept': 'application/json', **(headers or {})}
        if token:
            hdr['Authorization'] = 'Bearer ' + token
        body = None if data is None else json.dumps(data).encode()
        if body is not None:
            hdr['Content-Type'] = 'application/json'
        req = urllib.request.Request(self.base + path, data=body, headers=hdr, method=method)
        try:
            response = urllib.request.urlopen(req, timeout=self.timeout)
        except urllib.error.HTTPError as exc:
            response = exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise CheckFailed('No se pudo conectar al gateway o se agotó el tiempo de espera') from exc
        with response:
            raw = response.read()
            try:
                parsed = json.loads(raw) if raw else None
            except (UnicodeDecodeError, ValueError):
                parsed = None
            return response.status, parsed, dict(response.headers.items())


class Scenario:
    def __init__(self, client):
        self.client = client
        self.sessions = {}
        self.done = []

    def call(self, method, path, expected, data=None, role=None, headers=None):
        token = self.sessions[role]['token'] if role else None
        status, result, response_headers = self.client.request(method, path, data, token, headers)
        expect_status(status, expected)
        return result, response_headers

    def check(self, label, fn):
        print(f'  {label} ... ', end='', flush=True)
        try:
            fn()
        except (CheckFailed, KeyError, TypeError, ValueError, IndexError) as exc:
            print('FALLO')
            raise CheckFailed(f'{label}: {exc}') from exc
        self.done.append(label)
        print('OK')

    def login(self, role, email, password, expected_role):
        data, _ = self.call('POST', '/api/auth/login', 200, {'identificador': email, 'password': password})
        require(isinstance(data, dict), 'Respuesta de sesión inválida')
        require(isinstance(data.get('token'), str) and bool(data['token']), 'Falta token de sesión')
        require(type(data.get('usuarioId')) is int and data['usuarioId'] > 0, 'Identificador de usuario inválido')
        require(type(data.get('idEstablecimiento')) is int and data['idEstablecimiento'] > 0, 'Identificador de establecimiento inválido')
        require(str(data.get('rol', '')).removeprefix('ROLE_') == expected_role, 'Rol de sesión inesperado')
        self.sessions[role] = data

    def account(self):
        obj, _ = self.call('GET', f'/api/saldos/cuenta/{self.child}', 200, role='parent')
        require(isinstance(obj, dict), 'Cuenta inválida')
        for key in ('saldoActual', 'saldoComprometido', 'saldoDisponible'):
            require(type(obj.get(key)) is int, f'Campo de cuenta inválido: {key}')
        require(obj['saldoDisponible'] == obj['saldoActual'] - obj['saldoComprometido'] >= 0, 'Invariante de saldo incumplida')
        return {k: obj[k] for k in ('saldoActual', 'saldoComprometido', 'saldoDisponible')}

    def stock(self):
        obj, _ = self.call('GET', f'/api/productos/{self.product}', 200, role='parent')
        require(isinstance(obj, dict), 'Producto inválido')
        for key in ('stockFisico', 'stockReservado', 'stockDisponible', 'precio'):
            require(type(obj.get(key)) is int, f'Campo de producto inválido: {key}')
        require(obj['stockDisponible'] == obj['stockFisico'] - obj['stockReservado'] >= 0, 'Invariante de stock incumplida')
        return {k: obj[k] for k in ('stockFisico', 'stockReservado', 'stockDisponible', 'precio')}

    @staticmethod
    def ident(obj):
        require(isinstance(obj, dict) and type(obj.get('id')) is int and obj['id'] > 0, 'Falta identificador en respuesta')
        return obj['id']

    def prepare(self):
        credentials = [
            ('admin', 'ADMIN', 'admin@colegio.cl', 'admin123', 'ADMINISTRADOR'),
            ('other', 'OTRO_ADMIN', 'admin@sanagustin.cl', 'admin123', 'ADMINISTRADOR'),
            ('staff', 'ENCARGADO', 'libreria@colegio.cl', 'Edu123456', 'ENCARGADO'),
            ('parent', 'APODERADO', 'carlos.perez@gmail.com', 'Edu123456', 'APODERADO'),
            ('student', 'ALUMNO', 'tomas.perez@alumnos.colegio.cl', 'Edu123456', 'ALUMNO'),
        ]
        for role, env, default_user, default_password, expected_role in credentials:
            self.login(role, os.getenv('EDUSALDO_' + env + '_USUARIO', default_user), os.getenv('EDUSALDO_' + env + '_PASSWORD', default_password), expected_role)
        school = self.sessions['admin']['idEstablecimiento']
        require(all(self.sessions[r]['idEstablecimiento'] == school for r in ('staff', 'parent', 'student')), 'Los actores no pertenecen al mismo establecimiento')
        require(self.sessions['other']['idEstablecimiento'] != school, 'El segundo administrador pertenece al mismo establecimiento')
        self.child = self.sessions['student']['usuarioId']
        self.parent = self.sessions['parent']['usuarioId']
        linked, _ = self.call('GET', f'/api/usuarios/apoderados/{self.parent}/alumnos', 200, role='parent')
        require(isinstance(linked, list) and any(isinstance(x, dict) and x.get('id') == self.child for x in linked), 'El alumno autenticado no está vinculado al apoderado')
        marker = uuid.uuid4().hex[:12]
        category, _ = self.call('POST', '/api/categorias', 201, {'nombre': 'Prueba ' + marker, 'descripcion': 'Datos de prueba'}, 'admin')
        category_id = self.ident(category)
        product, _ = self.call('POST', '/api/productos', 201, {'categoriaId': category_id, 'sku': 'TEST-' + marker, 'nombre': 'Cuaderno de prueba', 'cursoNivel': 'Todos', 'precio': 1000, 'stockInicial': 5, 'stockCritico': 1}, 'admin')
        self.product = self.ident(product)
        require(product.get('precio') == 1000 and product.get('stockFisico') == 5 and product.get('stockReservado') == 0, 'Producto creado con valores inesperados')
        self.account()
        self.stock()

    def cors(self):
        headers = {'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type'}
        _, response = self.call('OPTIONS', '/api/auth/login', {200, 204}, headers=headers)
        response = {k.lower(): v for k, v in response.items()}
        require(response.get('access-control-allow-origin') == headers['Origin'], 'CORS no autoriza el origen local')
        require('POST' in response.get('access-control-allow-methods', ''), 'CORS no autoriza POST')
        headers['Origin'] = 'http://origen-invalido.example'
        status, _, response = self.client.request('OPTIONS', '/api/auth/login', headers=headers)
        require(status == 403 and 'access-control-allow-origin' not in {k.lower() for k in response}, 'CORS permite un origen ajeno')

    def security(self):
        self.call('GET', f'/api/saldos/cuenta/{self.child}', 200, role='student')
        self.call('GET', f'/api/saldos/cuenta/{self.child}', {401, 403})
        self.call('GET', f'/api/saldos/cuenta/{self.child}', {403, 404}, role='other')
        anteriores, _ = self.call('GET', '/api/auditoria', 200, role='admin')
        ids = {r['id'] for r in anteriores}
        self.call('GET', '/api/auditoria?dato=valor-privado', 403, role='parent')
        auditoria, _ = self.call('GET', '/api/auditoria', 200, role='admin')
        nuevos = [r for r in auditoria if r['id'] not in ids]
        require(any(r.get('accion') == 'ACCESO_DENEGADO' and r.get('usuarioId') == self.parent
                    and r.get('entidadId') == 'auditoria' and r.get('detalle') == 'GET' for r in nuevos),
                'No se registró el rechazo con el actor autenticado')
        require(all('valor-privado' not in str(r) for r in nuevos), 'Auditoría incluyó datos de la consulta')
        self.call('POST', '/internal/auditoria/denegacion', 403, {'metodo': 'GET', 'recurso': 'auditoria'}, 'parent')
        config, _ = self.call('GET', '/api/configuracion', 200, role='admin')
        self.call('PUT', '/api/configuracion', 400, {'nombreEstablecimiento': 'Cambio incompleto'}, 'admin')
        posterior, _ = self.call('GET', '/api/configuracion', 200, role='admin')
        require(posterior == config, 'Configuración inválida produjo cambios parciales')
        datos = {k: config.get(k) for k in ('nombreEstablecimiento', 'nombreLibreria', 'correoContacto', 'logoUrl')}
        self.call('PUT', '/api/configuracion', 403, datos, 'staff')
        self.call('PUT', '/api/configuracion', 200, datos, 'admin')
        alumno, _ = self.call('GET', f'/api/usuarios/{self.child}', 200, role='admin')
        cuenta = self.account()
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', {403, 404}, {'curso': 'Otro'}, 'other')
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', 403, {'curso': 'Otro'}, 'parent')
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', {400, 422}, {'rut': '23456789-0'}, 'admin')
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', {400, 422}, {'curso': '   '}, 'admin')
        sin_cambios, _ = self.call('GET', f'/api/usuarios/{self.child}', 200, role='admin')
        require(sin_cambios['curso'] == alumno['curso'] and sin_cambios['rut'] == alumno['rut'],
                'Una actualización inválida de alumno alteró sus datos')
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', 200,
                  {'curso': '8° Básico B', 'segundoNombre': 'Ignacio Editado'}, 'admin')
        editado, _ = self.call('GET', f'/api/usuarios/{self.child}', 200, role='admin')
        vinculados, _ = self.call('GET', f'/api/usuarios/apoderados/{self.parent}/alumnos', 200, role='parent')
        require(editado['curso'] == '8° Básico B' and editado['segundoNombre'] == 'Ignacio Editado'
                and any(x.get('id') == self.child for x in vinculados) and self.account() == cuenta,
                'Actualizar datos del alumno no persistió cambios o alteró vínculos/saldo')
        self.call('PUT', f'/api/usuarios/alumnos/{self.child}/curso', 200,
                  {'curso': alumno['curso'], 'segundoNombre': alumno.get('segundoNombre') or ''}, 'admin')
        self.call('PUT', f'/api/usuarios/{self.child}/inactivar', 422, role='admin')
        luego, _ = self.call('GET', f'/api/usuarios/{self.child}', 200, role='admin')
        require(luego['estado'] == alumno['estado'] and self.account() == cuenta,
                'La baja suspendida modificó al alumno o su saldo')
        self.call('POST', '/api/usuarios', {400, 422},
                  {'rut': '19000000-4', 'primerNombre': 'Admin', 'primerApellido': 'NoPermitido',
                   'correo': 'admin-no@example.org', 'rol': 'ADMINISTRADOR'}, 'admin')
        self.call('GET', '/api/saldos/abonos', 403, role='staff')
        self.call('GET', '/api/saldos/abonos', 403, role='student')
        self.call('POST', '/api/consentimiento', 201,
                  {'usuarioId': self.parent, 'versionAviso': '1.0'}, 'parent')
        propios, _ = self.call('GET', f'/api/consentimiento/usuario/{self.parent}', 200, role='parent')
        como_admin, _ = self.call('GET', f'/api/consentimiento/usuario/{self.parent}', 200, role='admin')
        require(isinstance(propios, list) and len(propios) >= 1 and propios == como_admin,
                'El consentimiento no fue consultable por titular y administrador del colegio')
        self.call('GET', f'/api/consentimiento/usuario/{self.parent}', 403, role='staff')
        self.call('GET', f'/api/consentimiento/usuario/{self.parent}', {403, 404}, role='other')

    def initiate(self, amount):
        obj, _ = self.call('POST', '/api/saldos/abonos/iniciar', 201, {'alumnoId': self.child, 'apoderadoId': self.parent, 'monto': amount}, 'parent')
        require(isinstance(obj, dict) and isinstance(obj.get('token'), str) and bool(obj['token']), 'Falta token del pago')
        return obj['token']

    def payment(self):
        before = self.account()
        previos, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        ids = {a['id'] for a in previos}
        token = self.initiate(5000)
        abonos, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        require(any(a['id'] not in ids and a['estado'] == 'PENDIENTE' and a['monto'] == 5000 for a in abonos)
                and self.account() == before, 'El abono no quedó pendiente sin acreditar saldo')
        body = {'token': token, 'resultadoSimulado': 'APROBADO'}
        payment, _ = self.call('POST', '/api/saldos/abonos/confirmar', 200, body, 'parent')
        require(isinstance(payment, dict) and payment.get('estado') == 'APROBADO' and type(payment.get('movimientoId')) is int, 'El pago no devolvió el movimiento aprobado')
        credited = self.account()
        require(credited['saldoActual'] == before['saldoActual'] + 5000 and credited['saldoComprometido'] == before['saldoComprometido'], 'El abono no acreditó el monto exacto')
        self.call('POST', '/api/saldos/abonos/confirmar', {200, 400, 409, 422}, body, 'parent')
        require(self.account() == credited, 'La repetición alteró el saldo')
        movements, _ = self.call('GET', f'/api/saldos/cuenta/{self.child}/movimientos', 200, role='parent')
        require(isinstance(movements, list) and any(isinstance(m, dict) and m.get('id') == payment['movimientoId'] and m.get('monto') == 5000 for m in movements), 'El movimiento del abono no quedó consultable')

    def concurrent_payment(self):
        before = self.account()
        token = self.initiate(700)
        body = {'token': token, 'resultadoSimulado': 'APROBADO'}
        with ThreadPoolExecutor(max_workers=2) as executor:
            results = list(executor.map(lambda _: self.client.request('POST', '/api/saldos/abonos/confirmar', body, self.sessions['parent']['token'])[0], range(2)))
        require(200 in results and all(s in {200, 400, 409, 422} for s in results), f'Confirmaciones concurrentes: HTTP {results}')
        after = self.account()
        require(after['saldoActual'] == before['saldoActual'] + 700 and after['saldoComprometido'] == before['saldoComprometido'], 'Confirmaciones concurrentes alteraron el saldo incorrectamente')

    def rejected_payment(self):
        before = self.account()
        token = self.initiate(900)
        result, _ = self.call('POST', '/api/saldos/abonos/confirmar', 200,
                              {'token': token, 'resultadoSimulado': 'RECHAZADO'}, 'parent')
        require(isinstance(result, dict) and result.get('estado') == 'RECHAZADO', 'El pago no quedó rechazado')
        require(self.account() == before, 'El pago rechazado modificó el saldo')

    def account_lock(self):
        policy, _ = self.call('GET', '/api/politica-acceso', 200, role='admin')
        require(isinstance(policy, dict), 'Política de acceso inválida')
        limit = policy.get('maxIntentosFallidos')
        require(type(limit) is int and 1 <= limit <= 20, 'Límite de intentos inválido')
        number = 30000000 + int(uuid.uuid4().hex[:8], 16) % 50000000
        total = sum(int(digit) * (2 + index % 6) for index, digit in enumerate(str(number)[::-1]))
        digit = 11 - total % 11
        rut = f'{number}-{("K" if digit == 10 else "0" if digit == 11 else digit)}'
        email = f'prueba-{uuid.uuid4().hex}@example.org'
        user, _ = self.call('POST', '/api/usuarios', 201,
                            {'rut': rut, 'primerNombre': 'Prueba', 'primerApellido': 'Automatica', 'correo': email, 'rol': 'APODERADO'}, 'admin')
        user_id = self.ident(user)
        reset, _ = self.call('POST', f'/api/usuarios/{user_id}/reset-password', 200, role='admin')
        require(isinstance(reset, dict) and isinstance(reset.get('tempPassword'), str) and reset['tempPassword'], 'Falta contraseña temporal')
        password = reset['tempPassword']
        self.call('POST', '/api/auth/login', 200, {'identificador': email, 'password': password})
        for _ in range(limit):
            self.call('POST', '/api/auth/login', 400, {'identificador': email, 'password': password + '-incorrecta'})
        result, _ = self.call('POST', '/api/auth/login', 422, {'identificador': email, 'password': password})
        require(isinstance(result, dict) and 'bloquead' in str(result.get('message', '')).lower(), 'La contraseña correcta no fue rechazada por bloqueo')

    def rejected_inputs(self):
        before, stock = self.account(), self.stock()
        abonos_previos, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        reservas_previas, _ = self.call('GET', f'/api/reservas/alumno/{self.child}', 200, role='parent')
        for amount in (0, -1):
            self.call('POST', '/api/saldos/abonos/iniciar', {400, 422}, {'alumnoId': self.child, 'apoderadoId': self.parent, 'monto': amount}, 'parent')
        self.call('POST', '/api/saldos/abonos/iniciar', 400, {'alumnoId': self.child, 'apoderadoId': self.parent, 'monto': 100.5}, 'parent')
        for quantity in (0, -1):
            self.call('POST', '/api/reservas', {400, 422}, {'alumnoId': self.child, 'items': [{'productoId': self.product, 'cantidad': quantity}]}, 'parent')
        self.call('POST', '/api/reservas', 400, {'alumnoId': self.child, 'items': [{'productoId': self.product, 'cantidad': 1.5}]}, 'parent')
        self.call('POST', '/api/inventario/ajustes/solicitar', 400,
                  {'productoId': self.product, 'cantidad': 1.5, 'motivo': 'Decimal inválido',
                   'encargadoId': self.sessions['staff']['usuarioId']}, 'staff')
        abonos_despues, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        reservas_despues, _ = self.call('GET', f'/api/reservas/alumno/{self.child}', 200, role='parent')
        require(self.account() == before and self.stock() == stock
                and len(abonos_despues) == len(abonos_previos)
                and len(reservas_despues) == len(reservas_previas),
                'Una solicitud inválida modificó saldo, inventario, abonos o reservas')

    def reserve(self):
        obj, _ = self.call('POST', '/api/reservas', 201, {'alumnoId': self.child, 'items': [{'productoId': self.product, 'cantidad': 1}]}, 'parent')
        return self.ident(obj)

    def cancellation(self):
        before, stock = self.account(), self.stock()
        require(before['saldoDisponible'] >= stock['precio'] and stock['stockDisponible'] >= 1, 'No hay saldo o stock suficiente para el escenario')
        reservation = self.reserve()
        datos, _ = self.call('GET', f'/api/reservas/{reservation}', 200, role='parent')
        avisos, _ = self.call('GET', '/api/reservas/notificaciones', 200, role='parent')
        aviso = next((a for a in avisos if a.get('reservaId') == reservation and a.get('tipoEvento') == 'RESERVA'), None)
        require(aviso is not None and datos['codigo'] in aviso['mensaje']
                and 'Cuaderno de prueba' in aviso['mensaje'] and 'cantidad 1' in aviso['mensaje']
                and str(stock['precio']) in aviso['mensaje'] and 'aún no se han entregado' in aviso['mensaje'],
                'La confirmación no describe correctamente la reserva')
        require(not aviso.get('destinatarioCorreo'), 'El aviso familiar expone destinatarios')
        held, held_stock = self.account(), self.stock()
        require(held['saldoActual'] == before['saldoActual'] and held['saldoComprometido'] == before['saldoComprometido'] + stock['precio'], 'Reserva no comprometió el monto')
        require(held_stock['stockFisico'] == stock['stockFisico'] and held_stock['stockReservado'] == stock['stockReservado'] + 1, 'Reserva no comprometió la unidad')
        self.call('POST', f'/api/reservas/{reservation}/cancelar', 400, {'motivo': '   '}, 'parent')
        require(self.account() == held and self.stock() == held_stock, 'Cancelación sin motivo modificó compromisos')
        self.call('POST', f'/api/reservas/{reservation}/cancelar', 200, {'motivo': 'Cancelación de prueba'}, 'parent')
        require(self.account() == before and self.stock() == stock, 'Cancelación no liberó saldo y stock')
        saved, _ = self.call('GET', f'/api/reservas/{reservation}', 200, role='parent')
        require(saved.get('estado') == 'CANCELADA', 'Cancelación no quedó persistida')
        operativa = self.reserve()
        self.call('POST', f'/api/reservas/{operativa}/marcar-lista', 200, role='staff')
        cancelada_op, _ = self.call('POST', f'/api/reservas/{operativa}/cancelar', 200,
                                    {'motivo': 'Cancelación operativa de prueba'}, 'staff')
        require(cancelada_op.get('estado') == 'CANCELADA'
                and cancelada_op.get('motivoCancelacion') == 'Cancelación operativa de prueba'
                and self.account() == before and self.stock() == stock,
                'La cancelación operativa en estado LISTA_PARA_RETIRO no liberó compromisos')

    def delivery_and_return(self):
        before, stock = self.account(), self.stock()
        reservation = self.reserve()
        self.call('POST', f'/api/reservas/{reservation}/marcar-lista', 200, role='staff')
        self.call('POST', f'/api/reservas/{reservation}/cancelar', {409, 422}, {'motivo': 'Intento de prueba'}, 'parent')
        saved, _ = self.call('GET', f'/api/reservas/{reservation}', 200, role='parent')
        require(saved.get('estado') == 'LISTA_PARA_RETIRO'
                and saved.get('preparadaPorId') == self.sessions['staff']['usuarioId']
                and bool(saved.get('fechaPreparacion'))
                and self.account()['saldoActual'] == before['saldoActual']
                and self.stock()['stockFisico'] == stock['stockFisico'],
                'La preparación o el rechazo alteró estado, trazabilidad o existencias físicas')
        delivery, _ = self.call('POST', f'/api/reservas/{reservation}/entregar', 201, role='staff')
        delivery_id = self.ident(delivery)
        require(delivery.get('reservaId') == reservation and delivery.get('origen') == 'RESERVA', 'Entrega no corresponde a la reserva')
        items = delivery.get('items')
        require(isinstance(items, list) and len(items) == 1, 'Detalle de entrega inválido')
        detail = self.ident(items[0])
        charged, delivered_stock = self.account(), self.stock()
        require(charged['saldoActual'] == before['saldoActual'] - stock['precio'] and charged['saldoComprometido'] == before['saldoComprometido'], 'Entrega no cobró correctamente')
        require(delivered_stock['stockFisico'] == stock['stockFisico'] - 1 and delivered_stock['stockReservado'] == stock['stockReservado'], 'Entrega no descontó correctamente el stock')
        self.call('POST', f'/api/reservas/{reservation}/entregar', {409, 422}, {}, 'staff')
        self.call('POST', f'/api/reservas/{reservation}/cancelar', {409, 422}, {'motivo': 'Intento posterior a entrega'}, 'parent')
        require(self.account() == charged and self.stock() == delivered_stock, 'La entrega repetida alteró los saldos')
        body = {'entregaId': delivery_id, 'motivo': 'Devolución de prueba', 'items': [{'detalleEntregaId': detail, 'cantidad': 1}]}
        returned, _ = self.call('POST', '/api/devoluciones', 201, body, 'staff')
        self.ident(returned)
        require(returned.get('entregaId') == delivery_id, 'Devolución desvinculada')
        require(self.account() == before and self.stock() == stock, 'Devolución no reintegró saldo y stock')
        self.call('POST', '/api/devoluciones', {409, 422}, body, 'staff')
        require(self.account() == before and self.stock() == stock, 'Devolución repetida alteró saldo o stock')

    def concurrent_correction(self):
        number = 30000000 + int(uuid.uuid4().hex[:8], 16) % 50000000
        total = sum(int(digit) * (2 + i % 6) for i, digit in enumerate(str(number)[::-1]))
        digit = 11 - total % 11
        rut = f'{number}-{("K" if digit == 10 else "0" if digit == 11 else digit)}'
        email = f'correccion-{uuid.uuid4().hex}@example.org'
        self.correction_email = email
        user, _ = self.call('POST', '/api/usuarios', 201,
                            {'rut': rut, 'primerNombre': 'Prueba', 'primerApellido': 'Correccion',
                             'correo': email, 'rol': 'APODERADO'}, 'admin')
        user_id = self.ident(user)
        reset, _ = self.call('POST', f'/api/usuarios/{user_id}/reset-password', 200, role='admin')
        password = reset['tempPassword']
        self.login('correction_user', email, password, 'APODERADO')
        self.call('POST', '/api/auth/cambiar-password', 200,
                  {'identificador': email, 'passwordActual': password, 'passwordNueva': 'NuevaClave12345'}, 'correction_user')
        self.login('correction_user', email, 'NuevaClave12345', 'APODERADO')
        body = {'idEstablecimiento': self.sessions['admin']['idEstablecimiento'], 'usuarioId': user_id,
                'campoSolicitado': 'inexistente', 'valorPropuesto': 'Prueba', 'motivo': 'Prueba'}
        self.call('POST', '/api/usuarios/solicitudes-correccion', {400, 422}, body, 'correction_user')
        body.update(campoSolicitado='primerNombre', valorPropuesto='Corregido')
        solicitud, _ = self.call('POST', '/api/usuarios/solicitudes-correccion', 201, body, 'correction_user')
        path = f'/api/usuarios/solicitudes-correccion/{self.ident(solicitud)}/resolver'
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.client.request('PUT', path, {'aprobar': True}, self.sessions['admin']['token'])[0], range(2)))
        require(results.count(200) == 1 and all(code in {200, 400, 409, 422} for code in results),
                f'Resoluciones concurrentes inesperadas: {results}')
        saved, _ = self.call('GET', f'/api/usuarios/{user_id}', 200, role='admin')
        require(saved.get('primerNombre') == 'Corregido', 'El dato aprobado no quedó persistido')

    def rut_validation(self):
        user = self.sessions['parent']
        cuerpo, dv = user['rut'].replace('.', '').split('-')
        formateado = f"{int(cuerpo):,}".replace(',', '.') + '-' + dv
        incorrecto = cuerpo + '-' + ('0' if dv != '0' else '1')
        self.login('rut_format', formateado,
                   os.getenv('EDUSALDO_APODERADO_PASSWORD', 'Edu123456'), 'APODERADO')
        require(self.sessions['rut_format']['usuarioId'] == user['usuarioId'], 'El formato de RUT no identifica a la misma persona')
        before, _ = self.call('GET', '/api/usuarios', 200, role='admin')
        body = {'primerNombre': 'Prueba', 'primerApellido': 'Rut', 'correo': f'rut-{uuid.uuid4().hex}@example.org', 'rol': 'APODERADO'}
        for rut in (incorrecto, formateado):
            self.call('POST', '/api/usuarios', {400, 409, 422}, {**body, 'rut': rut}, 'admin')
        after, _ = self.call('GET', '/api/usuarios', 200, role='admin')
        require(len(after) == len(before), 'Un RUT inválido o repetido creó un usuario')

    def liquidation(self):
        before = self.account()
        constancias_previas, _ = self.call('GET', '/api/saldos/constancias', 200, role='admin')
        ids_previos = {c['id'] for c in constancias_previas}
        require(before['saldoActual'] > 0 and before['saldoComprometido'] == 0, 'Cuenta no apta para liquidación')
        body = {'alumnoId': self.child, 'apoderadoId': self.parent, 'medio': 'EFECTIVO',
                'comprobante': 'TEST-' + uuid.uuid4().hex, 'motivo': 'Prueba de devolución manual'}
        invalid = {**body, 'apoderadoId': self.sessions['staff']['usuarioId']}
        self.call('POST', '/api/saldos/liquidar-retiro', {400, 403, 409, 422}, invalid, 'admin')
        require(self.account() == before, 'Una liquidación sin vínculo modificó el saldo')
        try:
            def liquidar(_): return self.client.request('POST', '/api/saldos/liquidar-retiro', body, self.sessions['admin']['token'])
            with ThreadPoolExecutor(max_workers=2) as pool:
                resultados = list(pool.map(liquidar, range(2)))
            codigos = [r[0] for r in resultados]
            require(codigos.count(200) == 1 and all(c in {200, 400, 409, 422} for c in codigos), f'Liquidaciones concurrentes: {codigos}')
            resultado = next(r[1] for r in resultados if r[0] == 200)
            require(resultado.get('montoLiquidado') == before['saldoActual'] and type(resultado.get('movimientoId')) is int, 'Liquidación sin movimiento exacto')
            require(self.account()['saldoActual'] == 0, 'Liquidación no dejó saldo en cero')
            constancias, _ = self.call('GET', '/api/saldos/constancias', 200, role='admin')
            creada = next((c for c in constancias if c['id'] not in ids_previos and c['alumnoId'] == self.child), None)
            require(creada is not None and creada['administradorId'] == self.sessions['admin']['usuarioId']
                    and creada['montoClp'] == before['saldoActual'], 'Constancia no figura correctamente en auditoría')
            ajenas, _ = self.call('GET', '/api/saldos/constancias', 200, role='other')
            require(all(c['id'] != creada['id'] for c in ajenas), 'Constancia expuesta a otro establecimiento')
            self.call('GET', '/api/saldos/constancias', 403, role='staff')
            self.call('GET', '/api/saldos/constancias', 403, role='parent')
        finally:
            actual = self.account()
            if actual['saldoActual'] == 0:
                token = self.initiate(before['saldoActual'])
                self.call('POST', '/api/saldos/abonos/confirmar', 200, {'token': token, 'resultadoSimulado': 'APROBADO'}, 'parent')
                require(self.account() == before, 'No se restauró el saldo de prueba')

    def contrato_ajustes(self):
        inicial = self.stock()
        solicitud, _ = self.call('POST', '/api/inventario/ajustes/solicitar', 201,
                                 {'productoId': self.product, 'cantidad': 1, 'motivo': 'Prueba de contrato',
                                  'encargadoId': self.sessions['staff']['usuarioId']}, 'staff')
        ajuste = self.ident(solicitud)
        ruta = f'/api/inventario/ajustes/{ajuste}/aprobar'
        self.call('POST', ruta, 403, {'administradorId': self.sessions['staff']['usuarioId']}, 'staff')
        self.call('POST', ruta, {403, 404, 422}, {'administradorId': self.sessions['other']['usuarioId']}, 'other')
        self.call('POST', ruta, {400, 403, 422}, {'autorizadorId': self.sessions['admin']['usuarioId']}, 'admin')
        require(self.stock() == inicial, 'El campo obsoleto modificó existencias')
        resultado, _ = self.call('POST', ruta, 200, {'administradorId': self.sessions['admin']['usuarioId']}, 'admin')
        require(resultado.get('estado') == 'APROBADA', 'El administrador no pudo aprobar el ajuste')
        require(self.stock()['stockFisico'] == inicial['stockFisico'] + 1, 'El ajuste no modificó el stock esperado')
        self.call('POST', ruta, {409, 422}, {'administradorId': self.sessions['admin']['usuarioId']}, 'admin')
        require(self.stock()['stockFisico'] == inicial['stockFisico'] + 1, 'La aprobación repetida alteró el stock')
        movimientos, _ = self.call('GET', f'/api/inventario/movimientos?productoId={self.product}&tipo=AJUSTE', 200, role='admin')
        require(any(m.get('responsableId') == self.sessions['admin']['usuarioId'] and m.get('variacionFisica') == 1 for m in movimientos),
                'El ajuste aprobado no aparece en el libro de inventario con su responsable')
        antes_rechazo = self.stock()
        pendiente, _ = self.call('POST', '/api/inventario/ajustes/solicitar', 201,
                                 {'productoId': self.product, 'cantidad': -1, 'motivo': 'Prueba de rechazo',
                                  'encargadoId': self.sessions['staff']['usuarioId']}, 'staff')
        rechazado, _ = self.call('POST', f"/api/inventario/ajustes/{self.ident(pendiente)}/rechazar", 200,
                                 {'administradorId': self.sessions['admin']['usuarioId'], 'motivoRechazo': 'Prueba'}, 'admin')
        require(rechazado.get('estado') == 'RECHAZADA' and self.stock() == antes_rechazo,
                'El rechazo no quedó registrado o alteró el stock')

    def reportes_cuentas(self):
        ruta = '/api/saldos/reportes/cuentas?desde=2020-01-01&hasta=2100-12-31'
        cuentas, _ = self.call('GET', ruta, 200, role='admin')
        otra, _ = self.call('GET', ruta, 200, role='other')
        registros, _ = self.call('GET', '/api/auditoria', 200, role='admin')
        ids_previos = {r['id'] for r in registros}
        self.call('GET', ruta, 403, role='staff')
        limite = time.monotonic() + 3
        while True:
            registros, _ = self.call('GET', '/api/auditoria', 200, role='admin')
            if any(r['id'] not in ids_previos and r.get('accion') == 'ACCESO_DENEGADO'
                   and r.get('usuarioId') == self.sessions['staff']['usuarioId']
                   and r.get('entidadId') == 'saldos' for r in registros):
                break
            require(time.monotonic() < limite, 'No se auditó la denegación del servicio de saldos')
            time.sleep(0.1)
        self.call('GET', ruta, 403, role='parent')
        require(isinstance(cuentas, list) and isinstance(otra, list), 'Reporte de cuentas inválido')
        for rol, resultado in [('admin', cuentas), ('other', otra)]:
            for fila in resultado:
                cuenta = fila['cuenta']
                require(cuenta['idEstablecimiento'] == self.sessions[rol]['idEstablecimiento'], 'Reporte expone otro establecimiento')
                require(cuenta['saldoDisponible'] == cuenta['saldoActual'] - cuenta['saldoComprometido'], 'Saldo de reporte inconsistente')
        hijo = next((fila for fila in cuentas if fila['cuenta']['alumnoId'] == self.child), None)
        require(hijo is not None and {'ENTREGA', 'DEVOLUCION'} <= {m['tipo'] for m in hijo['movimientos']}, 'Reporte no incluye entrega y devolución')
        periodo_vacio, _ = self.call('GET', '/api/saldos/reportes/cuentas?desde=1900-01-01&hasta=1900-12-31', 200, role='admin')
        mismo_hijo = next((fila for fila in periodo_vacio if fila['cuenta']['alumnoId'] == self.child), None)
        require(mismo_hijo is not None and mismo_hijo['movimientos'] == [], 'El reporte incluye movimientos fuera del período')

    def concurrent_recovery(self):
        self.call('POST', '/api/auth/recuperar-password', 202, {'correo': self.correction_email})
        messages, _ = self.call('GET', '/api/auth/correos-simulados', 200, role='admin')
        candidates = [item for item in messages if item.get('destinatario') == self.correction_email and item.get('tipo') == 'RECUPERACION']
        require(bool(candidates) and isinstance(candidates[0].get('contenido'), str), 'Falta código simulado')
        token = candidates[0]['contenido']
        def confirm(index):
            return self.client.request('POST', '/api/auth/confirmar-recuperacion',
                                       {'token': token, 'nuevaPassword': f'NuevaPrueba123{index}'})[0]
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(confirm, range(2)))
        require(results.count(200) == 1 and all(code in {200, 400, 409, 422} for code in results),
                f'Confirmaciones de recuperación inesperadas: {results}')
        self.login('recovered', self.correction_email, f'NuevaPrueba123{results.index(200)}', 'APODERADO')

    def cancelacion_ajena(self):
        inicial = self.account()
        stock = self.stock()
        abonos_previos, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        self.call('POST', '/api/saldos/abonos/iniciar', {403, 404},
                  {'alumnoId': self.child, 'apoderadoId': self.sessions['recovered']['usuarioId'], 'monto': 100}, 'recovered')
        abonos_despues, _ = self.call('GET', f'/api/saldos/abonos?alumnoId={self.child}', 200, role='admin')
        require(self.account() == inicial and len(abonos_previos) == len(abonos_despues), 'Tercero inició un abono para un alumno ajeno')
        reserva = self.reserve()
        comprometido, retenido = self.account(), self.stock()
        try:
            self.call('POST', f'/api/reservas/{reserva}/cancelar', {403, 404}, {'motivo': 'Intento de tercero'}, 'recovered')
            require(self.account() == comprometido and self.stock() == retenido, 'Tercero modificó una reserva ajena')
        finally:
            self.call('POST', f'/api/reservas/{reserva}/cancelar', 200, {'motivo': 'Limpieza de prueba'}, 'parent')
            require(self.account() == inicial and self.stock() == stock, 'No se restauraron los compromisos')


def main():
    scenario = Scenario(Client(os.getenv('EDUSALDO_GATEWAY', 'http://localhost:8090')))
    checks = [('Preparación de actores y datos', scenario.prepare), ('CORS', scenario.cors), ('Autorización y aislamiento', scenario.security), ('Pago y persistencia', scenario.payment), ('Confirmación concurrente', scenario.concurrent_payment), ('Pago rechazado', scenario.rejected_payment), ('Bloqueo de acceso', scenario.account_lock), ('Rechazo sin efectos', scenario.rejected_inputs), ('Reserva y cancelación', scenario.cancellation), ('Entrega y devolución', scenario.delivery_and_return), ('Contrato de ajustes', scenario.contrato_ajustes), ('Reporte de cuentas', scenario.reportes_cuentas), ('Corrección y concurrencia', scenario.concurrent_correction), ('Recuperación concurrente', scenario.concurrent_recovery), ('Cancelación ajena', scenario.cancelacion_ajena), ('RUT y duplicados', scenario.rut_validation), ('Liquidación y vínculo', scenario.liquidation), ('Contratos y colección Postman', verificar_contratos)]
    try:
        for label, fn in checks:
            scenario.check(label, fn)
    except CheckFailed as exc:
        print(f'Error: {exc}. Pruebas no ejecutadas: {len(checks) - len(scenario.done) - 1}.', file=sys.stderr)
        return 1
    print(f'Verificaciones completas: {len(scenario.done)}/{len(checks)}')
    return 0 if len(scenario.done) == len(checks) else 1


if __name__ == '__main__':
    sys.exit(main())
