# =============================================================================
# Propósito: Control del ciclo de vida de los 4 microservicios Spring Boot y el
#            API Gateway. Multiplataforma (Windows, Linux, macOS).
#
# Modos de uso:
#   1. Arrancar y monitorear logs en vivo:
#      python scripts/2_arrancar_servicios.py
#   2. Arrancar en segundo plano (para CI/CD o pruebas automáticas):
#      python scripts/2_arrancar_servicios.py --detached
#   3. Detener todos los servicios y liberar puertos 8090..8094:
#      python scripts/2_arrancar_servicios.py --stop
# =============================================================================

import json
import os
import platform
import signal
import subprocess
import sys
import time
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

# Activar soporte de colores ANSI en terminales Windows
try:
    import ctypes

    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
except Exception:
    pass

PORTS = [8090, 8091, 8092, 8093, 8094]
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend") if os.path.exists(os.path.join(ROOT_DIR, "backend")) else ROOT_DIR
PID_FILE = os.path.join(ROOT_DIR, "services_pids.json")

services = [
    ("edusaldo-ms-auth-usuarios", 8091, "\033[94m[AUTH 8091]\033[0m "),
    ("edusaldo-ms-alumnos-saldos", 8092, "\033[92m[SALDOS 8092]\033[0m "),
    ("edusaldo-ms-productos-inventario", 8093, "\033[93m[INVENTARIO 8093]\033[0m "),
    ("edusaldo-ms-ventas-reservas", 8094, "\033[95m[RESERVAS 8094]\033[0m "),
    ("edusaldo-api-gateway", 8090, "\033[96m[GATEWAY 8090]\033[0m "),
]


def kill_process(pid):
    try:
        if platform.system() == "Windows":
            subprocess.run(
                ["taskkill", "/F", "/PID", str(pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                check=False,
            )
        else:
            os.kill(pid, signal.SIGKILL)
        return True
    except Exception:
        return False


def get_pids_for_port(port):
    pids = set()
    if platform.system() == "Windows":
        try:
            output = subprocess.check_output(
                "netstat -ano -p tcp",
                shell=True,
                text=True,
                stderr=subprocess.DEVNULL,
            )
            for line in output.splitlines():
                line_clean = line.strip()
                if f":{port} " in line_clean and "LISTENING" in line_clean:
                    parts = line_clean.split()
                    if parts:
                        pid = int(parts[-1])
                        if pid > 0:
                            pids.add(pid)
        except Exception:
            pass
    else:
        try:
            output = subprocess.check_output(
                ["lsof", "-t", f"-i:{port}"],
                text=True,
                stderr=subprocess.DEVNULL,
            )
            for line in output.splitlines():
                line = line.strip()
                if line.isdigit():
                    pids.add(int(line))
        except Exception:
            pass
    return pids


def stop_all_services(quiet=False):
    stopped_count = 0
    killed_pids = set()

    # 1. Detener procesos registrados en PID_FILE
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, "r", encoding="utf-8") as f:
                pids_data = json.load(f)
            for name, info in pids_data.items():
                pid = info.get("pid")
                port = info.get("port")
                if pid:
                    if not quiet:
                        print(
                            f"  \033[93m[STOP]\033[0m Deteniendo {name} (PID: {pid}) en puerto {port}..."
                        )
                    if kill_process(pid):
                        killed_pids.add(pid)
                        stopped_count += 1
            os.remove(PID_FILE)
        except Exception as e:
            if not quiet:
                print(f"  \033[91m[WARN]\033[0m Error procesando {PID_FILE}: {e}")

    # 2. Inspeccionar puertos 8090..8094 por procesos huérfanos
    for port in PORTS:
        pids = get_pids_for_port(port)
        for pid in pids:
            if pid not in killed_pids:
                if not quiet:
                    print(
                        f"  \033[93m[STOP]\033[0m Deteniendo proceso huérfano (PID: {pid}) en puerto {port}..."
                    )
                if kill_process(pid):
                    killed_pids.add(pid)
                    stopped_count += 1

    return stopped_count


def check_port_online(port, timeout=1.0):
    try:
        req = urllib.request.Request(f"http://localhost:{port}/", method="HEAD")
        try:
            urllib.request.urlopen(req, timeout=timeout)
            return True
        except urllib.error.HTTPError:
            return True
    except Exception:
        return False


def main():
    args = set(sys.argv[1:])

    # Modo Detener
    if any(arg in args for arg in ["--stop", "--detener", "-s", "stop"]):
        print(
            "============================================================================="
        )
        print("  EDUSALDO - DETENIENDO MICROSERVICIOS Y GATEWAY")
        print(
            "============================================================================="
        )
        stopped = stop_all_services(quiet=False)
        if stopped == 0:
            print(
                "  \033[90m[INFO] No habia procesos activos en los puertos 8090..8094.\033[0m"
            )
        else:
            print(
                f"  \033[92m[OK] Se detuvieron {stopped} procesos correctamente. Puertos liberados.\033[0m"
            )
        sys.exit(0)

    detached_mode = any(
        arg in args for arg in ["--detached", "-d", "--background"]
    )

    print(
        "============================================================================="
    )
    print("  EDUSALDO - ARRANQUE Y MONITOREO DE 4 MICROSERVICIOS Y GATEWAY")
    print(
        "============================================================================="
    )
    print(f"Directorio backend detectado: {BACKEND_DIR}\n")

    # 1. Comprobar y liberar puertos ocupados previamente
    print("[1/3] Verificando estado inicial de puertos y liberando conflictos...")
    pre_cleaned = stop_all_services(quiet=True)
    if pre_cleaned > 0:
        print(
            f"      Se liberaron {pre_cleaned} procesos previos en los puertos 8090..8094."
        )
    else:
        print("      Puertos 8090..8094 verificados y libres.")

    logs_dir = os.path.join(BACKEND_DIR, "logs")
    os.makedirs(logs_dir, exist_ok=True)

    spawned_processes = []
    log_handles = []

    for name, port, tag in services:
        svc_dir = os.path.join(BACKEND_DIR, name)
        jar_file = None
        target_dir = os.path.join(svc_dir, "target")
        if os.path.exists(target_dir):
            for f in os.listdir(target_dir):
                if f.endswith(".jar") and not f.endswith(".original"):
                    jar_file = os.path.join(target_dir, f)
                    break

        if not jar_file or not os.path.exists(jar_file):
            print(
                f"[ERROR] No se encontro el archivo JAR en {target_dir}. Compila primero."
            )
            continue

        log_path = os.path.join(logs_dir, f"{name}.log")
        log_fp = open(log_path, "w", encoding="utf-8")
        log_handles.append(log_fp)

        kwargs = {}
        if platform.system() == "Windows":
            kwargs["creationflags"] = (
                subprocess.DETACHED_PROCESS
                | subprocess.CREATE_NEW_PROCESS_GROUP
            )
        else:
            kwargs["start_new_session"] = True

        p = subprocess.Popen(
            ["java", "-jar", jar_file],
            cwd=svc_dir,
            stdout=log_fp,
            stderr=log_fp,
            **kwargs,
        )
        spawned_processes.append((name, port, p, log_path, tag))
        print(f"  [START] {name} (PID: {p.pid}) -> Puerto {port}")

    # Guardar PIDs de los servicios activos
    pids_data = {
        name: {"pid": p.pid, "port": port}
        for name, port, p, _, _ in spawned_processes
    }
    with open(PID_FILE, "w", encoding="utf-8") as f:
        json.dump(pids_data, f, indent=2)

    # 2. Esperar disponibilidad de puertos
    print("\n[2/3] Esperando que los puertos abran...")
    timeout = 60
    t0 = time.time()
    ports_to_check = {port: name for name, port, _, _, _ in spawned_processes}

    while ports_to_check and (time.time() - t0) < timeout:
        for port in list(ports_to_check.keys()):
            name = ports_to_check[port]
            if check_port_online(port, timeout=1.0):
                print(
                    f"  [ONLINE] {name} escuchando en puerto {port} ({time.time()-t0:.1f}s)"
                )
                del ports_to_check[port]
        if ports_to_check:
            time.sleep(1.2)

    # 3. Estado del sistema
    print("\n[3/3] Estado del sistema:")
    if ports_to_check:
        print(
            "  \033[91m[ALERTA] Algunos servicios aun no responden en sus puertos:\033[0m",
            ports_to_check,
        )
        if detached_mode:
            sys.exit(1)
    else:
        print(
            "  \033[92m[OK] LOS 4 MICROSERVICIOS Y EL GATEWAY ESTAN 100% ONLINE Y OPERATIVOS.\033[0m"
        )

    print("\n" + "=" * 77)
    print("  URLS DISPONIBLES:")
    print("  * API Gateway Central:       http://localhost:8090")
    print(
        "  * MS Usuarios y Auth:        http://localhost:8091 (Swagger: /swagger-ui.html)"
    )
    print(
        "  * MS Alumnos y Saldos:       http://localhost:8092 (Swagger: /swagger-ui.html)"
    )
    print(
        "  * MS Productos e Inventario: http://localhost:8093 (Swagger: /swagger-ui.html)"
    )
    print(
        "  * MS Reservas y Entregas:    http://localhost:8094 (Swagger: /swagger-ui.html)"
    )
    print("=" * 77)

    if detached_mode:
        print(
            "  Modo segundo plano activado (--detached). Servicios ejecutándose."
        )
        print("  Para detenerlos: python scripts/2_arrancar_servicios.py --stop")
        print("=" * 77 + "\n")
        return

    print(
        "  MONITOR DE LOGS EN VIVO (Presiona Ctrl+C en cualquier momento para detener)"
    )
    print("=" * 77 + "\n")

    # Monitoreo de logs en vivo
    readers = {}
    for name, port, p, log_path, tag in spawned_processes:
        try:
            rfp = open(log_path, "r", encoding="utf-8", errors="replace")
            readers[name] = (rfp, tag)
        except Exception:
            pass

    try:
        while True:
            had_line = False
            for name, (rfp, tag) in readers.items():
                line = rfp.readline()
                while line:
                    had_line = True
                    cleaned = line.rstrip()
                    if cleaned:
                        try:
                            print(f"{tag}{cleaned}")
                        except Exception:
                            try:
                                safe_line = cleaned.encode(
                                    "ascii", errors="replace"
                                ).decode("ascii")
                                print(f"{tag}{safe_line}")
                            except Exception:
                                pass
                    line = rfp.readline()
            if not had_line:
                time.sleep(0.3)
    except KeyboardInterrupt:
        print(
            "\n\n[DETENIENDO] Cerrando los 4 microservicios y el API Gateway..."
        )
        stop_all_services(quiet=False)
        print("[OK] Todos los procesos fueron detenidos limpiamente.")
    finally:
        for fp in log_handles:
            try:
                fp.close()
            except Exception:
                pass
        for rfp, _ in readers.values():
            try:
                rfp.close()
            except Exception:
                pass
        if sys.stdin.isatty():
            print("\nPresiona Enter para cerrar esta consola...")
            try:
                input()
            except Exception:
                pass


if __name__ == "__main__":
    main()
