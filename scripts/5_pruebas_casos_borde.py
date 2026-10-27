# =============================================================================
# Propósito: Suite de Pruebas de Borde y Casos de Ataque ("Teacher Attack Suite")
#            Diseñada para evaluar la resiliencia y el blindaje ante intentos
#            deliberados de romper las invariantes de negocio de EduSaldo.
#            Verificación estricta de códigos HTTP y mensajes de error reales
#            sin falsos positivos por errores de validación sintáctica (400).
#            Multiplataforma (Windows, Linux, macOS).
# Ejecución: python scripts/5_pruebas_casos_borde.py
# =============================================================================

import json
import sys
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

# Activar colores ANSI en Windows
try:
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
except Exception:
    pass

GATEWAY = "http://localhost:8090"
passed = 0
failed = 0


def safe_print(text):
    try:
        print(text)
    except Exception:
        try:
            safe_text = str(text).encode("ascii", errors="replace").decode("ascii")
            print(safe_text)
        except Exception:
            pass


def invoke_api(method, endpoint, body=None):
    url = f"{GATEWAY}{endpoint}"
    status_code = 0
    res_obj = None

    data_bytes = None
    headers = {"Content-Type": "application/json"}
    if body is not None:
        data_bytes = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            status_code = resp.status
            content = resp.read().decode("utf-8")
            if content:
                try:
                    res_obj = json.loads(content)
                except Exception:
                    res_obj = {"raw": content}
    except urllib.error.HTTPError as e:
        status_code = e.code
        try:
            content = e.read().decode("utf-8")
            if content:
                res_obj = json.loads(content)
        except Exception:
            res_obj = {"error": str(e.reason)}
    except Exception as ex:
        status_code = 500
        res_obj = {"error": str(ex)}

    return {"status_code": status_code, "body": res_obj}


def check_edge(num, title, detail, expected_codes=(422,), expected_message_contains="", allow_validation_error=False):
    global passed, failed

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
        passed += 1
        safe_print(f"  \033[92m[PASS]\033[0m {num}. {title} -> Rechazo esperado ({st}): {msg}")
    else:
        failed += 1
        expected_str = ",".join(str(c) for c in expected_codes)
        safe_print(f"  \033[91m[FAIL]\033[0m {num}. {title} -> Obtenido: {st} (Msg: '{msg}'), Esperado: ({expected_str}) con '{expected_message_contains}'")
        if body:
            safe_print(f"         Respuesta: {json.dumps(body, ensure_ascii=False)}")


def main():
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
    check_edge("E03", "Bloqueo de abono para alumno no vinculado (S11)", r3, expected_codes=(400, 422), expected_message_contains="nculo")

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
        "usuarioId": 3
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
    sol_id = r_ajuste["body"].get("id", 1) if isinstance(r_ajuste.get("body"), dict) else 1

    r6 = invoke_api("POST", f"/api/inventario/ajustes/{sol_id}/aprobar", {
        "administradorId": 2
    })
    check_edge("E06", "Bloqueo de auto-aprobación de ajuste por el solicitante (HU44 CA3)", r6, expected_codes=(422,), expected_message_contains="propia solicitud")

    # 7. Entrega de reserva en estado PENDIENTE bloqueada (HU33 CA1)
    r_res = invoke_api("POST", "/api/reservas", {
        "alumnoId": 4,
        "creadaPorId": 3,
        "items": [
            {"productoId": 1, "cantidad": 1}
        ]
    })
    reserva_pend_id = r_res["body"].get("id", 1) if isinstance(r_res.get("body"), dict) else 1

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
    invoke_api("POST", f"/api/reservas/{reserva_pend_id}/marcar-lista", {
        "encargadoId": 2
    })
    r9 = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/cancelar", {
        "motivo": "Cancelacion tardia por apoderado",
        "usuarioId": 3,
        "rol": "ROLE_APODERADO"
    })
    check_edge("E09", "HU28: Bloqueo a Apoderado de cancelar reserva LISTA_PARA_RETIRO", r9, expected_codes=(422,), expected_message_contains="cancelar reservas en estado PENDIENTE")

    # 10. Cancelación de reserva ya ENTREGADA bloqueada
    invoke_api("POST", f"/api/reservas/{reserva_pend_id}/entregar", {
        "encargadoId": 2
    })
    r10 = invoke_api("POST", f"/api/reservas/{reserva_pend_id}/cancelar", {
        "motivo": "Intento cancelar despues de entregar",
        "usuarioId": 2,
        "rol": "ROLE_ENCARGADO"
    })
    check_edge("E10", "Invariante de Reserva: Rechazo al cancelar reserva ya ENTREGADA", r10, expected_codes=(422,), expected_message_contains="no se puede cancelar")

    # 11. Desvincular único apoderado activo de un alumno bloqueado (HU12 CA3)
    r11 = invoke_api("DELETE", "/api/usuarios/alumnos/4/apoderados/3?motivo=PruebaBorde")
    check_edge("E11", "HU12 CA3: Bloqueo de desvinculación de único apoderado activo", r11, expected_codes=(409, 422), expected_message_contains="apoderado")

    # 12. Creación de reserva autónoma por alumna menor de 12 años bloqueada (HU24/HU26)
    r12 = invoke_api("POST", "/api/reservas", {
        "alumnoId": 5,  # Sofía (9 años)
        "creadaPorId": 5,  # Reservando ella misma
        "items": [
            {"productoId": 1, "cantidad": 1}
        ]
    })
    check_edge("E12", "HU24/HU26: Bloqueo de reserva autónoma a menor de 12 años", r12, expected_codes=(422,), expected_message_contains="12")

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
    check_edge("E15", "Aislamiento Multi-tenant: Bloqueo de operaciones cruzadas entre colegios distintos", r15, expected_codes=(422, 404), expected_message_contains="nculo")

    safe_print("=============================================================================")
    safe_print(f"  RESULTADO CASOS DE BORDE: {passed} PASARON | {failed} FALLARON")
    safe_print("=============================================================================")

    sys.exit(failed)


if __name__ == "__main__":
    main()
