# =============================================================================
# Propósito: Suite completa de pruebas de integración en vivo que ejecuta
#            casos de uso reales, de borde y seguridad EXCLUSIVAMENTE a
#            través del API Gateway (puerto 8090) sobre los 4 microservicios de EduSaldo.
# Prerrequisitos: Los 5 servicios deben estar corriendo en puertos 8090 y 8091-8094.
#                Requiere datos semilla de prueba; crea y modifica registros.
# Ejecución: python scripts/4_pruebas_http_automaticas.py
# =============================================================================

import concurrent.futures
import datetime
import json
import secrets
import sys
import time
import uuid
import urllib.error
import urllib.request

# Reconfigurar stdout/stderr con UTF-8 y sustitución de caracteres para Windows
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass


def safe_print(text):
    try:
        print(text)
    except Exception:
        try:
            safe_text = str(text).encode("ascii", errors="replace").decode("ascii")
            print(safe_text)
        except Exception:
            pass


GATEWAY = "http://localhost:8090"
current_test_calls = []
passed = failed = 0
executed_cases = set()
edge_passed = edge_failed = 0

_ADMIN_TOKEN = None
_AUTO = object()
_ACTOR_TOKENS = {}


def random_rut():
    number = str(10000000 + secrets.randbelow(90000000))
    total = sum(int(digit) * (2 + index % 6) for index, digit in enumerate(reversed(number)))
    digit = 11 - total % 11
    check_digit = '0' if digit == 11 else 'K' if digit == 10 else str(digit)
    return f'{number[:2]}.{number[2:5]}.{number[5:]}-{check_digit}'


def request(method, path, payload=None, token=_AUTO):
    global _ADMIN_TOKEN
    if token is _AUTO:
        if _ADMIN_TOKEN is None:
            status, login = request("POST", "/api/auth/login", {"identificador": "admin@colegio.cl", "password": "admin123"}, token=None)
            if status != 200 or not isinstance(login, dict) or not login.get("token"):
                return 0, {"error": "No se pudo autenticar administrador de prueba"}
            _ADMIN_TOKEN = login["token"]
        token = _ADMIN_TOKEN
        actor = next((payload[k] for k in ('administradorId', 'encargadoId', 'usuarioId', 'creadaPorId') if isinstance(payload, dict) and payload.get(k)), 1)
        if actor != 1:
            if actor not in _ACTOR_TOKENS:
                user_status, user = request('GET', f'/api/usuarios/{actor}', token=_ADMIN_TOKEN)
                if user_status != 200 or not isinstance(user, dict):
                    return 0, {'error': 'No se pudo preparar la identidad solicitante'}
                password = 'Edu123456'
                if actor > 9:
                    pw_status, reset = request('POST', f'/api/usuarios/{actor}/reset-password', token=_ADMIN_TOKEN)
                    if pw_status != 200 or not isinstance(reset, dict):
                        return 0, {'error': 'No se pudo preparar credencial de prueba'}
                    password = reset.get('tempPassword')
                st, session = request('POST', '/api/auth/login', {'identificador': user['correo'], 'password': password}, token=None)
                if st != 200 or not isinstance(session, dict) or not session.get('token'):
                    return 0, {'error': 'No se pudo autenticar el actor de prueba'}
                _ACTOR_TOKENS[actor] = session['token']
            token = _ACTOR_TOKENS[actor]
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(GATEWAY + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        try:
            return exc.code, json.loads(exc.read())
        except (ValueError, UnicodeError):
            return exc.code, None
    except (OSError, ValueError) as exc:
        return 0, {'error': str(exc)}


def valid_snapshot(status, obj, fields):
    return status == 200 and isinstance(obj, dict) and all(isinstance(obj.get(f), int) and not isinstance(obj.get(f), bool) for f in fields)


def balance(alumno):
    return request('GET', f'/api/saldos/cuenta/{alumno}')


def product(pid):
    return request('GET', f'/api/productos/{pid}')


def logged_request(method, endpoint, data=None):
    status, body = request(method, endpoint, data)
    if not isinstance(body, (dict, list)):
        body = {"error": str(body), "message": str(body)}
    current_test_calls.append((method, GATEWAY + endpoint, data, status, body))
    return status, body


def post(endpoint, data):
    return logged_request("POST", endpoint, data)


def get(endpoint):
    return logged_request("GET", endpoint)


def put(endpoint, data=None):
    return logged_request("PUT", endpoint, data)


def delete(endpoint):
    return logged_request("DELETE", endpoint)


def invoke_api(method, endpoint, body=None):
    status, result = request(method, endpoint, body)
    return {"status_code": status, "body": result}


def format_multiline(data, indent="            "):
    if data is None:
        return f"{indent}None"
    try:
        def redact(value):
            if isinstance(value, dict):
                return {k: '[REDACTADO]' if any(secret in k.lower() for secret in ('password', 'token', 'contrasena')) else redact(v) for k, v in value.items()}
            if isinstance(value, list):
                return [redact(v) for v in value]
            return value
        text = json.dumps(redact(data), indent=2, ensure_ascii=False)
        return "\n".join(f"{indent}{line}" for line in text.splitlines())
    except Exception:
        return f"{indent}{str(data)}"


def check(num, desc, cond, extra=""):
    global passed, failed
    executed_cases.add(num)
    if cond:
        passed += 1
        safe_print(f"  [PASS] {num}. {desc} {extra}")
    else:
        failed += 1
        safe_print(f"  [FAIL] {num}. {desc} {extra}")
    for method, url, payload, status, resp in current_test_calls:
        safe_print(f"       -> [{method}] {url}")
        if payload is not None:
            safe_print("          Payload Enviado:")
            safe_print(format_multiline(payload, "            "))
        safe_print(f"       <- HTTP {status}")
        safe_print("          Respuesta del Microservicio:")
        safe_print(format_multiline(resp, "            "))
    current_test_calls.clear()


def run_integration():
    global passed, failed
    passed = failed = 0
    executed_cases.clear()
    current_test_calls.clear()
    print("=============================================================================")
    print("  EDUSALDO - BATERÍA COMPLETA DE PRUEBAS EN VIVO VÍA API GATEWAY (8090)")
    print("=============================================================================")

    # -----------------------------------------------------------------------------
    # 1. MS USUARIOS Y AUTH (Puerto 8091)
    # -----------------------------------------------------------------------------
    print("\n--- 1. MS USUARIOS Y AUTH (Puerto 8091) ---")

    # Caso 1: Login exitoso
    st, res = post(
        "/api/auth/login", {"identificador": "admin@colegio.cl", "password": "admin123"}
    )
    check(
        "01",
        "Login Administrador exitoso",
        st == 200 and "token" in res,
        f"(Usuario: {res.get('nombreCompleto')})",
    )

    # Caso 2: Login con credenciales incorrectas
    st, res = post(
        "/api/auth/login",
        {"identificador": "admin@colegio.cl", "password": "clave_falsa_999"},
    )
    check(
        "02",
        "Login fallido controlado con rechazo",
        st in [400, 401],
        f"(Mensaje: {res.get('message')})",
    )

    # Caso 3: Alta atómica Alumno + Apoderado (HU15)
    ts = int(time.time())
    st, res = post(
        "/api/usuarios/alumnos",
        {
            "rutAlumno": random_rut(),
            "primerNombreAlumno": "Tomás",
            "primerApellidoAlumno": "González",
            "fechaNacimiento": "2012-05-15",
            "curso": "7° Básico",
            "rutApoderado": random_rut(),
            "primerNombreApoderado": "Carlos",
            "primerApellidoApoderado": "González",
            "correoApoderado": f"apoderado_{ts}@gmail.com",
            "telefonoApoderado": "+56912345678",
            "parentesco": "PADRE",
        },
    )
    check(
        "03",
        "Alta atómica Alumno + Apoderado (HU15)",
        st in [200, 201] and res.get("alumnoId") is not None,
        f"(Alumno ID: {res.get('alumnoId')})",
    )
    created_alumno_id = res.get("alumnoId")
    created_apoderado_id = res.get("apoderadoId")

    # Caso 4: Consulta de alumnos de un apoderado (HU17)
    if created_apoderado_id:
        st, res = get(f"/api/usuarios/apoderados/{created_apoderado_id}/alumnos")
        check(
            "04",
            "Consulta de pupilos asociados a apoderado (HU17)",
            st == 200 and len(res) >= 1,
        )

    # Caso 05: Consulta de configuración institucional
    st_cfg, res_cfg = get("/api/configuracion")
    check(
        "05",
        "Consulta de configuración institucional",
        st_cfg == 200 and "nombreEstablecimiento" in res_cfg,
    )

    # Caso 06: Consulta de usuario Alumno por ID (HU04 Autonomía >= 12 años)
    st_alu, res_alu = get(f"/api/usuarios/{created_alumno_id if created_alumno_id else 1}")
    check(
        "06",
        "Consulta de usuario Alumno por ID (HU04 Autonomía >= 12 años)",
        st_alu == 200
        and res_alu.get("id") == (created_alumno_id if created_alumno_id else 1),
    )

    # Caso 07: Verificación de registro de auditoría de seguridad
    st_aud, res_aud = get("/api/auditoria")
    check(
        "07",
        "Verificación de registro de auditoría de seguridad",
        st_aud == 200 and len(res_aud) >= 1,
    )

    # -----------------------------------------------------------------------------
    # 2. MS SALDOS Y ABONOS (Puerto 8092)
    # -----------------------------------------------------------------------------
    print("\n--- 2. MS SALDOS Y ABONOS (Puerto 8092) ---")

    alumno_target = created_alumno_id if created_alumno_id else 1
    # Caso 08: Consulta de saldo inicial de pupilo
    st, res = get(f"/api/saldos/cuenta/{alumno_target}")
    check(
        "08",
        "Consulta de saldo inicial de pupilo",
        st in [200, 201] and "saldoDisponible" in res,
    )

    # Caso 09: Inicio de abono Webpay simulado (Token UUID generado)
    st, res = post(
        "/api/saldos/abonos/iniciar",
        {
            "apoderadoId": created_apoderado_id if created_apoderado_id else 1,
            "alumnoId": alumno_target,
            "monto": 15000,
        },
    )
    check(
        "09",
        "Inicio de abono Webpay simulado (Token UUID generado)",
        st in [200, 201] and "token" in res,
    )
    token_abono = res.get("token")

    # Caso 10: Confirmación de abono y acreditación en CuentaSaldo
    if token_abono:
        st, res = post("/api/saldos/abonos/confirmar", {"token": token_abono})
        check(
            "10",
            "Confirmación de abono y acreditación en CuentaSaldo",
            st == 200 and res.get("estado") == "APROBADO",
        )

    # Caso 11: Edge case - Retención fallida por saldo insuficiente (400/422)
    st, res = post(
        "/api/saldos/retener",
        {"alumnoId": alumno_target, "monto": 9999999, "reservaId": 999},
    )
    check("11", "Rechazo controlado por saldo insuficiente (400/422)", st in [400, 422])

    # Caso 12: Consulta de libro mayor MovimientoSaldo
    st, res = get(f"/api/saldos/cuenta/{alumno_target}/movimientos")
    check("12", "Consulta de libro mayor MovimientoSaldo", st == 200 and len(res) >= 1)

    # -----------------------------------------------------------------------------
    # 3. MS PRODUCTOS E INVENTARIO (Puerto 8093)
    # -----------------------------------------------------------------------------
    print("\n--- 3. MS PRODUCTOS E INVENTARIO (Puerto 8093) ---")

    # Caso 13: Consulta de catálogo y existencias
    st, res = get("/api/productos")
    check("13", "Consulta de catálogo y existencias", st == 200 and len(res) >= 1)
    prod_target_id = res[0].get("id") if (isinstance(res, list) and len(res) > 0) else 1

    # Caso 14: Ingreso manual de stock por Encargado (HU46)
    st, res = post(
        "/api/inventario/ingresos-manuales",
        {
            "encargadoId": 2,
            "proveedor": "Distribuidora Central Escolar",
            "documentoReferencia": "GUIA-DESPACHO-4581",
            "observacion": "Recepción de materiales",
            "detalles": [{"productoId": prod_target_id, "cantidad": 20}],
        },
    )
    check("14", "Ingreso manual de stock por Encargado (HU46)", st in [200, 201])

    # Caso 15: Solicitud de ajuste de stock en PENDIENTE
    st, res = post(
        "/api/inventario/ajustes/solicitar",
        {
            "productoId": prod_target_id,
            "cantidad": -2,
            "motivo": "Merma por deterioro en estante",
            "encargadoId": 2,
        },
    )
    check(
        "15",
        "Solicitud de ajuste de stock en PENDIENTE",
        st in [200, 201] and res.get("estado") == "PENDIENTE",
    )
    ajuste_id = res.get("id")

    # Caso 16: Aprobación de ajuste por Administrador e impacto en stock
    if ajuste_id:
        st, res = post(
            f"/api/inventario/ajustes/{ajuste_id}/aprobar", {"administradorId": 1}
        )
        check(
            "16",
            "Aprobación de ajuste por Administrador e impacto en stock",
            st == 200 and res.get("estado") == "APROBADA",
        )

    # Caso 17: Consulta de libro mayor MovimientoInventario
    st, res = get("/api/inventario/movimientos")
    check("17", "Consulta de libro mayor MovimientoInventario", st == 200 and len(res) >= 1)

    # -----------------------------------------------------------------------------
    # 4. MS RESERVAS Y ENTREGAS (Puerto 8094)
    # -----------------------------------------------------------------------------
    print("\n--- 4. MS RESERVAS Y ENTREGAS (Puerto 8094) ---")

    # Caso 18: Creación de reserva con retención de saldo y stock
    st, res = post(
        "/api/reservas",
        {
            "alumnoId": alumno_target,
            "creadaPorId": created_apoderado_id if created_apoderado_id else 1,
            "items": [
                {
                    "productoId": prod_target_id,
                    "nombreProducto": "Cuaderno universitario",
                    "cantidad": 2,
                    "precioUnitario": 1500,
                }
            ],
        },
    )
    check(
        "18",
        "Creación de reserva con retención de saldo y stock",
        st in [200, 201] and res.get("estado") == "PENDIENTE",
    )
    reserva_id = res.get("id")

    # Caso 19: Preparación de reserva (HU31 CA2: preparadaPorId y fecha)
    if reserva_id:
        st, res = post(f"/api/reservas/{reserva_id}/marcar-lista", {"encargadoId": 2})
        check(
            "19",
            "Preparación de reserva (HU31 CA2: preparadaPorId y fecha)",
            st == 200
            and res.get("preparadaPorId") == 2
            and res.get("fechaPreparacion") is not None,
        )

    # Caso 20: Confirmación de retiro genera Entrega formal
    if reserva_id:
        st, res = post(f"/api/reservas/{reserva_id}/entregar", {"encargadoId": 2})
        check(
            "20",
            "Confirmación de retiro genera Entrega formal",
            st in [200, 201] and res.get("origen") == "RESERVA",
        )
        entrega_id = res.get("id")

    # Caso 21: Entrega directa presencial en mesón (MESON)
    st, res = post(
        "/api/entregas/meson",
        {
            "alumnoId": alumno_target,
            "encargadoId": 2,
            "items": [
                {
                    "productoId": prod_target_id,
                    "nombreProducto": "Lápiz grafito",
                    "cantidad": 1,
                    "precioUnitario": 500,
                }
            ],
        },
    )
    check(
        "21",
        "Entrega directa presencial en mesón (MESON)",
        st in [200, 201] and res.get("origen") == "MESON",
    )

    # Caso 22: Cancelación de reserva por Alumno >= 12 años
    st_res2, res2 = post(
        "/api/reservas",
        {
            "alumnoId": alumno_target,
            "creadaPorId": alumno_target,
            "items": [
                {
                    "productoId": prod_target_id,
                    "nombreProducto": "Regla 30cm",
                    "cantidad": 1,
                    "precioUnitario": 800,
                }
            ],
        },
    )
    if st_res2 in [200, 201] and res2.get("id"):
        r2_id = res2.get("id")
        st, res = post(
            f"/api/reservas/{r2_id}/cancelar",
            {
                "motivo": "Cancelado por alumno antes de retiro",
                "usuarioId": alumno_target,
                "rol": "ALU",
            },
        )
        check(
            "22",
            "Cancelación de reserva por Alumno >= 12 años",
            st == 200 and res.get("estado") == "CANCELADA",
        )

    # Caso 23: Consulta de historial de entregas operativas
    st, res = get("/api/entregas/historial")
    check("23", "Consulta de historial de entregas operativas", st == 200 and len(res) >= 1)

    print("\n=============================================================================")
    missing_cases = sorted({f"{n:02d}" for n in range(1, 24)} - executed_cases)
    if missing_cases:
        print(f"[FAIL] Casos omitidos por condiciones previas: {', '.join(missing_cases)}")
        failed += len(missing_cases)
    print(f"  RESULTADO FINAL: {passed} CASOS PASARON | {failed} CASOS FALLARON")
    print("=============================================================================")

    if failed == 0:
        print("[OK] Todos los casos de esta batería pasaron.")
    else:
        print("ALERTA: Se detectaron fallos en la batería de pruebas.")


    return passed, failed, created_alumno_id, created_apoderado_id, prod_target_id


def check_edge(num, title, detail, expected_codes=(422,), expected_message_contains="", allow_validation_error=False):
    global edge_passed, edge_failed

    st = detail["status_code"]
    body = detail.get("body") or {}

    code_match = st in expected_codes
    msg_match = True
    msg = body.get("message", "") if isinstance(body, dict) else str(body)

    if expected_message_contains != "":
        msg_match = expected_message_contains.lower() in msg.lower()

    val_error = isinstance(body, dict) and body.get("error") == "Validation Error"
    not_val_error = allow_validation_error or (not val_error)

    success = code_match and msg_match and not_val_error

    if success:
        edge_passed += 1
        safe_print(f"  \033[92m[PASS]\033[0m {num}. {title} -> Rechazo esperado ({st}): {msg}")
    else:
        edge_failed += 1
        expected_str = ",".join(str(c) for c in expected_codes)
        safe_print(f"  \033[91m[FAIL]\033[0m {num}. {title} -> Obtenido: {st} (Msg: '{msg}'), Esperado: ({expected_str}) con '{expected_message_contains}'")
        if body:
            safe_print(f"         Respuesta: {json.dumps(body, ensure_ascii=False)}")


def run_edge_cases():
    safe_print("=============================================================================")
    safe_print("  EDUSALDO - SUITE DE CASOS DE BORDE Y RESILIENCIA (15 CONTROLES)")
    safe_print("=============================================================================")

    # 1. Registro público de Administrador bloqueado (HU02 CA1)
    r1 = invoke_api("POST", "/api/usuarios", {
        "idEstablecimiento": 1,
        "rut": "19.999.888-7",
        "primerNombre": "Hacker",
        "primerApellido": "Admin",
        "correo": "hacker@test.cl",
        "rol": "ADMINISTRADOR"
    })
    check_edge("E01", "Bloqueo de creación pública de Administrador (HU02 CA1)", r1, expected_codes=(400, 422), expected_message_contains="HU02 CA1")

    # 2. Abono con monto negativo o cero bloqueado
    r2 = invoke_api("POST", "/api/saldos/abonos/iniciar", {
        "alumnoId": 4,
        "apoderadoId": 3,
        "monto": -5000
    })
    check_edge("E02", "Bloqueo de abono con monto negativo/cero", r2, expected_codes=(400,), expected_message_contains="monto", allow_validation_error=True)

    # 3. Abono para alumno sin vínculo con el apoderado bloqueado (S11)
    r3 = invoke_api("POST", "/api/saldos/abonos/iniciar", {
        "alumnoId": 9,  # Alumno de Colegio 2
        "apoderadoId": 3,  # Apoderado de Colegio 1
        "monto": 10000
    })
    check_edge("E03", "Bloqueo de abono para alumno no vinculado (S11)", r3, expected_codes=(403,), expected_message_contains="Acceso no autorizado")

    # 4. Retención de saldo mayor al disponible bloqueada (Invariante Saldo)
    r4 = invoke_api("POST", "/api/saldos/retener", {
        "alumnoId": 4,
        "monto": 99999999,
        "reservaId": 9999
    })
    check_edge("E04", "Invariante de Saldo: Rechazo por sobregiro", r4, expected_codes=(422,), expected_message_contains="Saldo insuficiente")

    # 5. Retención de stock mayor al físico disponible bloqueada (Invariante Stock)
    r5 = invoke_api("POST", "/api/inventario/retener", {
        "productoId": 1,
        "cantidad": 999999,
        "reservaId": 9999,
        "usuarioId": 2
    })
    check_edge("E05", "Invariante de Stock: Rechazo por stock insuficiente", r5, expected_codes=(422,), expected_message_contains="Stock insuficiente")

    # 6. Auto-aprobación de ajuste de stock por el mismo Encargado bloqueada (HU44 CA3)
    r_ajuste = invoke_api("POST", "/api/inventario/ajustes/solicitar", {
        "idEstablecimiento": 1,
        "productoId": 1,
        "cantidad": 5,
        "motivo": "Reposición de prueba para evaluar auto-aprobación",
        "encargadoId": 2
    })
    sol_id = r_ajuste["body"].get("id") if r_ajuste["status_code"] in (200, 201) and isinstance(r_ajuste.get("body"), dict) else None

    r6 = invoke_api("POST", f"/api/inventario/ajustes/{sol_id}/aprobar", {
        "administradorId": 2
    })
    check_edge("E06", "Bloqueo de auto-aprobación de ajuste por el solicitante (HU44 CA3)", r6, expected_codes=(403,), expected_message_contains="Acceso no autorizado")

    # 7. Entrega de reserva en estado PENDIENTE bloqueada (HU33 CA1)
    r_res = invoke_api("POST", "/api/reservas", {
        "alumnoId": 4,
        "creadaPorId": 3,
        "items": [
            {"productoId": 1, "cantidad": 1}
        ]
    })
    reserva_pend_id = r_res["body"].get("id") if r_res["status_code"] in (200, 201) and isinstance(r_res.get("body"), dict) else None

    # Intento de entregar directamente sin preparar
    r7 = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/entregar", {
        "encargadoId": 2
    })
    check_edge("E07", "Bloqueo de entrega de reserva en estado PENDIENTE (HU33 CA1)", r7, expected_codes=(422,), expected_message_contains="lista para entrega")

    # 8. Devolución de más ítems de los entregados bloqueada (Invariante Devolución)
    r8 = invoke_api("POST", "/api/devoluciones", {
        "entregaId": 1,
        "encargadoId": 2,
        "motivo": "Intento devolver exceso",
        "items": [
            {"detalleEntregaId": 1, "cantidad": 9999}
        ]
    })
    check_edge("E08", "Invariante de Devolución: Rechazo al devolver más de lo entregado", r8, expected_codes=(422,), expected_message_contains="excede")

    # 9. Cancelación por Apoderado de reserva LISTA_PARA_RETIRO bloqueada (HU28 vs HU32)
    preparada = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/marcar-lista", {
        "encargadoId": 2
    })
    r9 = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/cancelar", {
        "motivo": "Cancelacion tardia por apoderado",
        "usuarioId": 3,
        "rol": "ROLE_APODERADO"
    })
    if preparada["status_code"] != 200 or not isinstance(preparada.get("body"), dict) or preparada["body"].get("estado") != "LISTA_PARA_RETIRO":
        r9 = {"status_code": 0, "body": {"message": "No se pudo preparar la reserva"}}
    check_edge("E09", "HU28: Bloqueo a Apoderado de cancelar reserva LISTA_PARA_RETIRO", r9, expected_codes=(422,), expected_message_contains="cancelar reservas en estado PENDIENTE")

    # 10. Cancelación de reserva ya ENTREGADA bloqueada
    entregada = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/entregar", {
        "encargadoId": 2
    })
    r10 = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/cancelar", {
        "motivo": "Intento cancelar despues de entregar",
        "usuarioId": 2,
        "rol": "ROLE_ENCARGADO"
    })
    if entregada["status_code"] not in (200, 201):
        r10 = {"status_code": 0, "body": {"message": "No se pudo entregar la reserva"}}
    check_edge("E10", "Invariante de Reserva: Rechazo al cancelar reserva ya ENTREGADA", r10, expected_codes=(422,), expected_message_contains="no se puede cancelar")

    # 11. Desvincular único apoderado activo de un alumno bloqueado (HU12 CA3)
    r11 = invoke_api("DELETE", "/api/usuarios/alumnos/4/apoderados/3?motivo=PruebaBorde")
    check_edge("E11", "HU12 CA3: Bloqueo de desvinculación de único apoderado activo", r11, expected_codes=(409, 422), expected_message_contains="apoderado")

    # 12. Creación de reserva autónoma por alumna menor de 12 años bloqueada (HU24/HU26)
    r12 = invoke_api("POST", "/api/auth/login", {
        "identificador": "sofia.perez@alumnos.colegio.cl", "password": "Edu123456"
    })
    check_edge("E12", "HU24/HU26: Bloqueo de acceso autónomo a menor de 12 años", r12, expected_codes=(422,), expected_message_contains="12")

    # 13. Bloqueo de confirmación de abono Webpay con token falso o inexistente (HU21)
    r13 = invoke_api("POST", "/api/saldos/abonos/confirmar", {
        "token": "TOKEN-HACKER-FALSO-9999"
    })
    check_edge("E13", "HU21: Bloqueo de confirmación de abono con token falso o inexistente", r13, expected_codes=(400, 422), expected_message_contains="token")

    # 14. Inactivación de categoría con productos asociados bloqueada
    r14 = invoke_api("DELETE", "/api/categorias/1")
    check_edge("E14", "Bloqueo de inactivación de categoría con productos asociados", r14, expected_codes=(400, 422), expected_message_contains="productos asociados")

    # 15. Aislamiento multi-tenant: Operación cruzada entre colegios bloqueada
    r15 = invoke_api("POST", "/api/saldos/abonos/iniciar", {
        "alumnoId": 9,  # Alumno de Colegio 2
        "apoderadoId": 3,  # Apoderado de Colegio 1
        "monto": 5000
    })
    check_edge("E15", "Aislamiento Multi-tenant: Bloqueo de operaciones cruzadas entre colegios distintos", r15, expected_codes=(403,), expected_message_contains="Acceso no autorizado")

    safe_print("=============================================================================")
    safe_print(f"  RESULTADO CASOS DE BORDE: {edge_passed} PASARON | {edge_failed} FALLARON")
    safe_print("=============================================================================")

    return edge_failed


def run_advanced(alumno, apoderado, producto):
    results = []
    def check(label, ok, detail=''):
        results.append(bool(ok))
        print(f"  [{'PASS' if ok else 'FAIL'}] {label}" + (f' ({detail})' if detail else ''))
    def snapshot(alumno_id, producto_id):
        bs, b = balance(alumno_id); ps, p = product(producto_id)
        valid = valid_snapshot(bs, b, ('saldoActual', 'saldoComprometido', 'saldoDisponible')) and valid_snapshot(ps, p, ('stockFisico', 'stockReservado', 'stockDisponible'))
        return (b, p) if valid else (None, None)
    def invariants(b, p):
        return bool(b and p and b['saldoDisponible'] == b['saldoActual'] - b['saldoComprometido'] >= 0 and p['stockDisponible'] == p['stockFisico'] - p['stockReservado'] >= 0)
    def reserve(a, owner, pid, qty=1):
        return request('POST', '/api/reservas', {'alumnoId': a, 'creadaPorId': owner, 'items': [{'productoId': pid, 'cantidad': qty}]})
    def cancel(rid, owner, role='APODERADO'):
        return request('POST', f'/api/reservas/{rid}/cancelar', {'usuarioId': owner, 'rol': role, 'motivo': 'Prueba automatizada'})

    print('\n--- CONTROLES ADICIONALES DE NEGOCIO Y SEGURIDAD ---')
    if not all((alumno, apoderado, producto)):
        check('Datos creados por la batería inicial', False, 'faltan identificadores; no se usan valores de reemplazo')
        return 0, 1

    # Preparar identidades nuevas, para no cambiar credenciales ni vínculos de usuarios semilla.
    unique = uuid.uuid4().hex[:12]
    create_status, new_parent = request('POST', '/api/usuarios', {
        'rut': random_rut(), 'primerNombre': 'Prueba', 'primerApellido': 'Apoderado',
        'correo': f'prueba-{unique}@example.com', 'rol': 'APODERADO'})
    parent_id = new_parent.get('id') if create_status == 201 and isinstance(new_parent, dict) else None
    if parent_id:
        link_status, _ = request('POST', f'/api/usuarios/alumnos/{alumno}/apoderados/{parent_id}')
        list_status, pupils = request('GET', f'/api/usuarios/apoderados/{parent_id}/alumnos')
        check('Segundo apoderado puede vincularse y consultar alumno', link_status == 201 and list_status == 200 and isinstance(pupils, list) and any(isinstance(p, dict) and p.get('id') == alumno for p in pupils), f'HTTP {link_status}/{list_status}')
        unlink_status, _ = request('DELETE', f'/api/usuarios/alumnos/{alumno}/apoderados/{parent_id}?motivo=Prueba')
        list_status, pupils = request('GET', f'/api/usuarios/apoderados/{parent_id}/alumnos')
        check('Desvincular segundo apoderado conserva alumno sin vínculo activo con él', unlink_status == 200 and list_status == 200 and isinstance(pupils, list) and all(not isinstance(p, dict) or p.get('id') != alumno for p in pupils), f'HTTP {unlink_status}/{list_status}')
        active_status, _ = request('PUT', f'/api/usuarios/{alumno}/reactivar')
        child_status, child = request('GET', f'/api/usuarios/{alumno}')
        if active_status == 200 and child_status == 200 and isinstance(child, dict) and child.get('estado') == 'ACTIVA':
            last_status, _ = request('DELETE', f'/api/usuarios/alumnos/{alumno}/apoderados/{apoderado}?motivo=Prueba')
            list_status, pupils = request('GET', f'/api/usuarios/apoderados/{apoderado}/alumnos')
            check('Último apoderado de alumno activo permanece vinculado', last_status in (400, 409, 422) and list_status == 200 and isinstance(pupils, list) and any(isinstance(p, dict) and p.get('id') == alumno for p in pupils), f'HTTP {last_status}/{list_status}')
            if last_status == 200:
                restore_status, _ = request('POST', f'/api/usuarios/alumnos/{alumno}/apoderados/{apoderado}')
                restore_list_status, restored = request('GET', f'/api/usuarios/apoderados/{apoderado}/alumnos')
                check('Restauración del vínculo para pruebas posteriores', restore_status == 201 and restore_list_status == 200 and isinstance(restored, list) and any(isinstance(p, dict) and p.get('id') == alumno for p in restored), f'HTTP {restore_status}/{restore_list_status}')
        else:
            check('Preparación de alumno activo para desvinculación', False, f'HTTP {active_status}/{child_status}')

        email = new_parent.get('correo')
        reset_status, recovery = request('POST', '/api/auth/recuperar-password', {'correo': email})
        recovery_token = recovery.get('token') if reset_status == 200 and isinstance(recovery, dict) else None
        if recovery_token:
            reset1, _ = request('POST', '/api/auth/confirmar-recuperacion', {'token': recovery_token, 'nuevaPassword': 'NuevaClave123!'})
            reset2, _ = request('POST', '/api/auth/confirmar-recuperacion', {'token': recovery_token, 'nuevaPassword': 'OtraClave123!'})
            login_status, own_session = request('POST', '/api/auth/login', {'identificador': email, 'password': 'NuevaClave123!'}, token=None)
            check('Recuperación cambia clave y token no puede reutilizarse', reset1 == 200 and reset2 in (400, 401, 403, 409, 422) and login_status == 200, f'HTTP {reset1}/{reset2}/{login_status}')
            for universal in ('admin123', 'Edu123456'):
                wrong_status, _ = request('POST', '/api/auth/login', {'identificador': email, 'password': universal}, token=None)
                check('Contraseña de demostración no autentica cuenta ajena', wrong_status in (400, 401, 403, 422), f'HTTP {wrong_status}')
            if login_status == 200 and isinstance(own_session, dict) and own_session.get('token'):
                closed, _ = request('POST', '/api/auth/cerrar-sesion', token=own_session['token'])
                revoked, _ = request('GET', f'/api/usuarios/{parent_id}', token=own_session['token'])
                check('Sesión cerrada no vuelve a acceder a recursos', closed == 200 and revoked == 401, f'HTTP {closed}/{revoked}')

        else:
            check('Preparación de recuperación de contraseña', False, f'HTTP {reset_status}')
    else:
        check('Preparación de segundo apoderado', False, f'HTTP {create_status}')

    # Fecha de nacimiento alrededor del duodécimo cumpleaños.
    today = datetime.date.today()
    try:
        birthday = today.replace(year=today.year - 12)
    except ValueError:
        birthday = today.replace(year=today.year - 12, day=28)
    for label, birth, expected in [('menor de 12', birthday + datetime.timedelta(days=1), False), ('12 años', birthday, True), ('mayor de 12', birthday - datetime.timedelta(days=1), True)]:
        tag = uuid.uuid4().hex[:12]
        create_status, created = request('POST', '/api/usuarios', {
            'rut': random_rut(), 'primerNombre': 'Edad', 'primerApellido': 'Prueba',
            'correo': f'edad-{tag}@example.com', 'rol': 'ALUMNO',
            'fechaNacimiento': birth.isoformat(), 'curso': 'Prueba'})
        child_id = created.get('id') if create_status == 201 and isinstance(created, dict) else None
        if child_id:
            age_status, age_info = request('GET', f'/api/usuarios/alumnos/{child_id}/puede-reservar')
            check(f'Edad límite {label}: capacidad para reservar', age_status == 200 and isinstance(age_info, dict) and age_info.get('puedeReservar') is expected, f'HTTP {age_status}')
            pw_status, pw = request('POST', f'/api/usuarios/{child_id}/reset-password')
            temp = pw.get('tempPassword') if pw_status == 200 and isinstance(pw, dict) else None
            if temp:
                login_status, _ = request('POST', '/api/auth/login', {'identificador': created.get('correo'), 'password': temp})
                check(f'Edad límite {label}: acceso web', login_status == 200 if expected else login_status in (400, 401, 403, 409, 422), f'HTTP {login_status}')
            else:
                check(f'Preparación de credenciales para alumno {label}', False, f'HTTP {pw_status}')
        else:
            check(f'Preparación de alumno {label}', False, f'HTTP {create_status}')
    b0, p0 = snapshot(alumno, producto)
    check('Invariantes iniciales de saldo y stock', invariants(b0, p0))

    # La misma operación confirmada repetidamente debe tener un único efecto.
    status, started = request('POST', '/api/saldos/abonos/iniciar', {'alumnoId': alumno, 'apoderadoId': apoderado, 'monto': 1000})
    token = started.get('token') if status in (200, 201) and isinstance(started, dict) else None
    if token and b0:
        first, _ = request('POST', '/api/saldos/abonos/confirmar', {'token': token})
        second, _ = request('POST', '/api/saldos/abonos/confirmar', {'token': token})
        bs, b1 = balance(alumno)
        check('Confirmación repetida acredita una sola vez', first == 200 and second in (200, 400, 409, 422) and valid_snapshot(bs, b1, ('saldoActual', 'saldoComprometido', 'saldoDisponible')) and b1['saldoActual'] == b0['saldoActual'] + 1000 and b1['saldoComprometido'] == b0['saldoComprometido'], f'HTTP {first}/{second}')
        ms, moves = request('GET', f'/api/saldos/cuenta/{alumno}/movimientos')
        check('Abono confirmado genera exactamente un movimiento', ms == 200 and isinstance(moves, list) and sum(1 for m in moves if isinstance(m, dict) and token in json.dumps(m)) == 1)
    else:
        check('Preparación de abono para idempotencia', False, f'HTTP {status}')

    bs, initial = balance(alumno)
    status, started = request('POST', '/api/saldos/abonos/iniciar', {'alumnoId': alumno, 'apoderadoId': apoderado, 'monto': 700})
    concurrent_token = started.get('token') if status in (200, 201) and isinstance(started, dict) else None
    if concurrent_token and valid_snapshot(bs, initial, ('saldoActual', 'saldoComprometido', 'saldoDisponible')):
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = list(pool.map(lambda _: request('POST', '/api/saldos/abonos/confirmar', {'token': concurrent_token}), range(2)))
        end_status, end = balance(alumno)
        check('Confirmaciones simultáneas acreditan una sola vez', valid_snapshot(end_status, end, ('saldoActual', 'saldoComprometido', 'saldoDisponible')) and end['saldoActual'] == initial['saldoActual'] + 700 and any(s == 200 for s, _ in outcomes) and all(s in (200, 400, 409, 422) for s, _ in outcomes), f"HTTP {[s for s, _ in outcomes]}")
    else:
        check('Preparación de confirmaciones simultáneas', False, f'HTTP {status}')

    # Conteos no pueden modificar el inventario aunque exista diferencia.
    ps, before = product(producto)
    if valid_snapshot(ps, before, ('stockFisico', 'stockReservado', 'stockDisponible')):
        cs, conteo = request('POST', '/api/inventario/conteos-fisicos', {'encargadoId': 2, 'observaciones': 'Prueba de diferencia', 'detalles': [{'productoId': producto, 'stockContado': before['stockFisico'] + 1}]})
        ps2, after = product(producto)
        check('Conteo con diferencia no cambia stock físico ni reservado', cs == 201 and valid_snapshot(ps2, after, ('stockFisico', 'stockReservado', 'stockDisponible')) and all(before[k] == after[k] for k in ('stockFisico', 'stockReservado', 'stockDisponible')), f'HTTP {cs}')
    else:
        check('Lectura inicial de stock para conteo', False, f'HTTP {ps}')

    ps, stock_before = product(producto)
    adjust_status, adjust = request('POST', '/api/inventario/ajustes/solicitar', {'productoId': producto, 'cantidad': 2, 'motivo': 'Prueba de rechazo', 'encargadoId': 2})
    aid = adjust.get('id') if adjust_status == 201 and isinstance(adjust, dict) else None
    if aid and valid_snapshot(ps, stock_before, ('stockFisico', 'stockReservado', 'stockDisponible')):
        rejected_status, rejected = request('POST', f'/api/inventario/ajustes/{aid}/rechazar', {'administradorId': 1, 'motivoRechazo': 'Prueba'})
        _, stock_after = product(producto)
        check('Ajuste rechazado no modifica stock', rejected_status == 200 and isinstance(rejected, dict) and rejected.get('estado') == 'RECHAZADA' and stock_after == stock_before, f'HTTP {rejected_status}')
        twice, _ = request('POST', f'/api/inventario/ajustes/{aid}/aprobar', {'administradorId': 1})
        _, stock_twice = product(producto)
        check('Ajuste rechazado no puede aprobarse posteriormente', twice in (400, 409, 422) and stock_twice == stock_before, f'HTTP {twice}')
    else:
        check('Preparación de ajuste rechazado', False, f'HTTP {adjust_status}')

    b_before, p_before = snapshot(alumno, producto)
    rs, reservation = reserve(alumno, apoderado, producto)
    rid = reservation.get('id') if rs == 201 and isinstance(reservation, dict) else None
    b_reserved, p_reserved = snapshot(alumno, producto)
    if rid and invariants(b_before, p_before) and invariants(b_reserved, p_reserved):
        price = p_before.get('precio')
        check('Reserva compromete precio y una unidad', isinstance(price, int) and b_reserved['saldoActual'] == b_before['saldoActual'] and b_reserved['saldoComprometido'] == b_before['saldoComprometido'] + price and p_reserved['stockFisico'] == p_before['stockFisico'] and p_reserved['stockReservado'] == p_before['stockReservado'] + 1, f"saldo {b_before['saldoComprometido']}→{b_reserved['saldoComprometido']}, stock {p_before['stockReservado']}→{p_reserved['stockReservado']}, precio {price}")
        c1, _ = cancel(rid, apoderado)
        b_after, p_after = snapshot(alumno, producto)
        check('Cancelación restituye compromisos sin alterar saldos físicos', c1 == 200 and b_after == b_before and p_after == p_before, f'HTTP {c1}')
        c2, _ = cancel(rid, apoderado)
        b_again, p_again = snapshot(alumno, producto)
        check('Cancelar dos veces no cambia el estado', c2 in (400, 409, 422) and b_again == b_after and p_again == p_after, f'HTTP {c2}')
    else:
        check('Preparación de reserva y captura de estado', False, f'HTTP {rs}')

    # Transiciones válidas e inválidas y devolución parcial de una entrega propia.
    rs, reservation = reserve(alumno, apoderado, producto, 2)
    rid2 = reservation.get('id') if rs == 201 and isinstance(reservation, dict) else None
    if rid2:
        ready_status, ready = request('POST', f'/api/reservas/{rid2}/marcar-lista', {'encargadoId': 2})
        check('Preparación registra responsable y fecha', ready_status == 200 and isinstance(ready, dict) and ready.get('estado') == 'LISTA_PARA_RETIRO' and ready.get('preparadaPorId') == 2 and bool(ready.get('fechaPreparacion')), f'HTTP {ready_status}')
        again, _ = request('POST', f'/api/reservas/{rid2}/marcar-lista', {'encargadoId': 2})
        check('Reserva ya preparada no se prepara dos veces', again in (400, 409, 422), f'HTTP {again}')
        denied, _ = cancel(rid2, apoderado)
        check('Apoderado no cancela reserva preparada', denied in (400, 403, 409, 422), f'HTTP {denied}')
        forged, _ = request('POST', f'/api/reservas/{rid2}/cancelar?rol=ADMINISTRADOR&usuarioId=1', token=_ACTOR_TOKENS.get(apoderado))
        state_status, state = request('GET', f'/api/reservas/{rid2}')
        check('Parámetros de consulta no permiten suplantar rol administrador', forged in (403, 409, 422) and state_status == 200 and isinstance(state, dict) and state.get('estado') == 'LISTA_PARA_RETIRO', f'HTTP {forged}/{state_status}')

        delivery_status, delivery = request('POST', f'/api/reservas/{rid2}/entregar', {'encargadoId': 2})
        eid = delivery.get('id') if delivery_status == 201 and isinstance(delivery, dict) else None
        check('Entrega de reserva preparada', bool(eid) and delivery.get('origen') == 'RESERVA', f'HTTP {delivery_status}')
        if eid:
            duplicate, _ = request('POST', f'/api/reservas/{rid2}/entregar', {'encargadoId': 2})
            check('Entrega repetida se rechaza', duplicate in (400, 409, 422), f'HTTP {duplicate}')
            items = delivery.get('items') or []
            did = items[0].get('id') if items and isinstance(items[0], dict) else None
            if did:
                before_b, before_p = snapshot(alumno, producto)
                ds, returned = request('POST', '/api/devoluciones', {'entregaId': eid, 'encargadoId': 2, 'motivo': 'Devolución parcial de prueba', 'items': [{'detalleEntregaId': did, 'cantidad': 1}]})
                after_b, after_p = snapshot(alumno, producto)
                price = items[0].get('precioUnitario')
                detail = f"HTTP {ds}, saldo {before_b and before_b.get('saldoActual')}→{after_b and after_b.get('saldoActual')}, stock {before_p and before_p.get('stockFisico')}→{after_p and after_p.get('stockFisico')}, precio {price}"
                check('Devolución parcial reintegra una unidad y su precio', ds == 201 and invariants(before_b, before_p) and invariants(after_b, after_p) and isinstance(price, int) and after_b['saldoActual'] == before_b['saldoActual'] + price and after_p['stockFisico'] == before_p['stockFisico'] + 1, detail)
            else:
                check('Preparación de devolución: detalle de entrega', False)
        else:
            check('Preparación de devolución: entrega propia', False)
    else:
        check('Preparación de ciclo de entrega y devolución', False, f'HTTP {rs}')

    # Validación de frontera: rechazar y comprobar que no hay movimiento.
    for qty in (0, -1, 1.5, 2147483648):
        before_b, before_p = snapshot(alumno, producto)
        st, result = reserve(alumno, apoderado, producto, qty)
        after_b, after_p = snapshot(alumno, producto)
        check(f'Cantidad inválida {qty} no crea compromisos', st in (400, 409, 422) and before_b is not None and before_b == after_b and before_p == after_p, f'HTTP {st}')
        if st == 201 and isinstance(result, dict) and result.get('id'):
            cleanup_status, _ = cancel(result['id'], apoderado)
            check(f'Limpieza de reserva aceptada con cantidad {qty}', cleanup_status == 200, f'HTTP {cleanup_status}')

    for amount in (0, -1, 2147483648):
        bs, before = balance(alumno)
        status, _ = request('POST', '/api/saldos/abonos/iniciar', {'alumnoId': alumno, 'apoderadoId': apoderado, 'monto': amount})
        after_status, after = balance(alumno)
        check(f'Abono inválido {amount} no cambia el saldo', status in (400, 409, 422) and valid_snapshot(bs, before, ('saldoActual', 'saldoComprometido', 'saldoDisponible')) and after_status == 200 and before == after, f'HTTP {status}')

    for label, data in [('lista vacía', {'alumnoId': alumno, 'creadaPorId': apoderado, 'items': []}), ('producto inexistente', {'alumnoId': alumno, 'creadaPorId': apoderado, 'items': [{'productoId': 2147483647, 'cantidad': 1}]})]:
        b_before, p_before = snapshot(alumno, producto)
        status, created = request('POST', '/api/reservas', data)
        b_after, p_after = snapshot(alumno, producto)
        check(f'Reserva con {label} no afecta saldo ni stock', status in (400, 403, 404, 409, 422) and b_before is not None and b_before == b_after and p_before == p_after, f'HTTP {status}')
        if status == 201 and isinstance(created, dict) and created.get('id'):
            cleanup_status, _ = cancel(created['id'], apoderado)
            check(f'Limpieza de reserva aceptada con {label}', cleanup_status == 200, f'HTTP {cleanup_status}')

    # Probar autorización sin credenciales, sin realizar operaciones mutantes.
    for label, path in [('cuenta de alumno', '/api/saldos/cuenta/4'), ('datos de usuario', '/api/usuarios/3'), ('auditoría', '/api/auditoria'), ('reserva', '/api/reservas/1'), ('historial de entregas', '/api/entregas/historial'), ('solicitudes de corrección', '/api/usuarios/solicitudes-correccion')]:
        st, _ = request('GET', path, token=None)
        check(f'Seguridad: {label} sin sesión es rechazado', st in (401, 403), f'HTTP {st}')
    st, _ = request('GET', '/api/saldos/cuenta/4', token='token-invalido')
    check('Seguridad: token inválido rechazado', st in (401, 403), f'HTTP {st}')
    login_status, login = request('POST', '/api/auth/login', {'identificador': 'carlos.perez@gmail.com', 'password': 'Edu123456'})
    auth = login.get('token') if login_status == 200 and isinstance(login, dict) else None
    if auth:
        st, _ = request('GET', '/api/saldos/cuenta/9', token=auth)
        check('Seguridad: apoderado no consulta saldo de otro colegio', st in (403, 404), f'HTTP {st}')
        st, _ = request('GET', '/api/auditoria', token=auth)
        check('Seguridad: apoderado no accede a auditoría administrativa', st in (403, 404), f'HTTP {st}')
    else:
        check('Seguridad: preparación de sesión apoderado', False, f'HTTP {login_status}')
    st, obj = request('GET', '/api/usuarios/3')
    serialized = json.dumps(obj).lower() if obj is not None else ''
    check('Respuesta de usuario no expone hash ni contraseña', st in (401, 403) or (st == 200 and all(k not in serialized for k in ('passwordhash', 'password_hash', 'password', 'contrasena'))), f'HTTP {st}')

    print(f'RESULTADO ADICIONAL: {sum(results)} PASARON | {len(results) - sum(results)} FALLARON')
    return sum(results), len(results) - sum(results)


def main():
    integration_passed, integration_failed, alumno, apoderado, producto = run_integration()
    run_edge_cases()
    advanced_passed, advanced_failed = run_advanced(alumno, apoderado, producto)
    total_passed = integration_passed + edge_passed + advanced_passed
    total_failed = integration_failed + edge_failed + advanced_failed
    print(f"\nRESULTADO TOTAL: {total_passed} PASARON | {total_failed} FALLARON")
    return 1 if total_failed else 0


if __name__ == "__main__":
    sys.exit(main())
