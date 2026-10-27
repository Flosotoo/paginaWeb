# =============================================================================
# Propósito: Detiene todos los microservicios de EduSaldo y el API Gateway
#            liberando los puertos 8090, 8091, 8092, 8093 y 8094.
#            Multiplataforma (Windows, Linux, macOS).
# Ejecución: python backend/scripts/detener_servicios.py
# =============================================================================

import os
import sys
import json
import signal
import subprocess
import platform

# Activar soporte de colores ANSI en Windows
try:
    import ctypes
    kernel32 = ctypes.windll.kernel32
    kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
except Exception:
    pass

PORTS = [8090, 8091, 8092, 8093, 8094]
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def find_root_dir():
    candidates = [
        os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..')),
        os.path.abspath(os.path.join(SCRIPT_DIR, '..')),
        os.path.abspath('.')
    ]
    for c in candidates:
        if os.path.exists(os.path.join(c, 'edusaldo-api-gateway')) or os.path.exists(os.path.join(c, 'backend')):
            return c
    return candidates[0]

ROOT_DIR = find_root_dir()

def get_pids_for_port_windows(port):
    pids = set()
    try:
        output = subprocess.check_output(f'netstat -ano -p tcp', shell=True, text=True, stderr=subprocess.DEVNULL)
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
    return pids

def get_pids_for_port_posix(port):
    pids = set()
    try:
        output = subprocess.check_output(['lsof', '-t', f'-i:{port}'], text=True, stderr=subprocess.DEVNULL)
        for line in output.splitlines():
            line = line.strip()
            if line.isdigit():
                pids.add(int(line))
    except Exception:
        pass
    return pids

def kill_process(pid):
    try:
        if platform.system() == "Windows":
            subprocess.run(['taskkill', '/F', '/PID', str(pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
        else:
            os.kill(pid, signal.SIGKILL)
        return True
    except Exception:
        return False

def main():
    print("=============================================================================")
    print("  EDUSALDO - DETENIENDO MICROSERVICIOS Y GATEWAY")
    print("=============================================================================")

    killed_pids = set()

    # 1. Detener procesos registrados en services_pids.json
    pid_file = os.path.join(ROOT_DIR, 'services_pids.json')
    if os.path.exists(pid_file):
        try:
            with open(pid_file, 'r', encoding='utf-8') as f:
                pids_data = json.load(f)
            for name, info in pids_data.items():
                pid = info.get('pid')
                port = info.get('port')
                if pid:
                    print(f"  \033[93m[STOP]\033[0m Deteniendo {name} (PID: {pid}) en puerto {port}...")
                    if kill_process(pid):
                        killed_pids.add(pid)
            os.remove(pid_file)
        except Exception as e:
            print(f"  \033[91m[WARN]\033[0m No se pudo procesar {pid_file}: {e}")

    # 2. Inspeccionar puertos 8090..8094 por procesos remanentes
    is_windows = platform.system() == "Windows"
    for port in PORTS:
        pids = get_pids_for_port_windows(port) if is_windows else get_pids_for_port_posix(port)
        for pid in pids:
            if pid not in killed_pids:
                print(f"  \033[93m[STOP]\033[0m Deteniendo proceso huérfano (PID: {pid}) en puerto {port}...")
                if kill_process(pid):
                    killed_pids.add(pid)

    # 3. Resumen
    if not killed_pids:
        print("  \033[90m[INFO] No habia procesos activos en los puertos 8090..8094.\033[0m")
    else:
        print(f"  \033[92m[OK] Se detuvieron {len(killed_pids)} procesos correctamente. Puertos liberados.\033[0m")

if __name__ == '__main__':
    main()
