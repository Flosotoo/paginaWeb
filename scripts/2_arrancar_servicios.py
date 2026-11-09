import argparse
import json
import os
from pathlib import Path
import platform
import secrets
import signal
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / 'backend'
SERVICES = (
    ('edusaldo-ms-auth-usuarios', 8091, 'db_usuarios'),
    ('edusaldo-ms-alumnos-saldos', 8092, 'db_saldos'),
    ('edusaldo-ms-productos-inventario', 8093, 'db_inventario'),
    ('edusaldo-ms-ventas-reservas', 8094, 'db_reservas'),
    ('edusaldo-api-gateway', 8090, None),
)
PID_FILE = ROOT / 'services_pids.json'
KEY_FILE = ROOT / '.agents/notas/servicios.key'


def java_environment():
    environment = os.environ.copy()
    candidates = [os.environ.get('EDUSALDO_JAVA_HOME'), os.environ.get('JAVA_HOME'),
                  '/usr/lib/jvm/java-17-openjdk']
    for candidate in candidates:
        if not candidate:
            continue
        executable = Path(candidate) / 'bin' / ('java.exe' if os.name == 'nt' else 'java')
        if not executable.is_file():
            continue
        result = subprocess.run([str(executable), '-version'], capture_output=True, text=True)
        if result.returncode == 0 and 'version "17.' in result.stderr:
            environment['JAVA_HOME'] = str(candidate)
            environment['PATH'] = str(executable.parent) + os.pathsep + environment.get('PATH', '')
            return environment
    result = subprocess.run(['java', '-version'], capture_output=True, text=True)
    if result.returncode == 0 and 'version "17.' in result.stderr:
        return environment
    raise RuntimeError('Se requiere Java 17. Configura EDUSALDO_JAVA_HOME con la instalación local.')


def ready(port, key=None, timeout=2):
    path = '/salud' if port == 8090 else '/internal/salud'
    headers = {'X-Internal-Key': key} if key else {}
    request = urllib.request.Request(f'http://127.0.0.1:{port}{path}', headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = json.load(response)
            return response.status == 200 and isinstance(body, dict) and body.get('status') == 'UP'
    except urllib.error.HTTPError as error:
        error.close()
        return False
    except (OSError, ValueError):
        return False


def kill_process(pid):
    try:
        if platform.system() == 'Windows':
            result = subprocess.run(['taskkill', '/F', '/PID', str(pid)],
                                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return result.returncode == 0
        os.kill(pid, signal.SIGTERM)
        for _ in range(30):
            if not Path(f'/proc/{pid}').exists():
                return True
            time.sleep(0.1)
        os.kill(pid, signal.SIGKILL)
        return True
    except ProcessLookupError:
        return True
    except OSError:
        return False


def owned_process(pid, jar):
    try:
        if platform.system() == 'Windows':
            result = subprocess.run(['powershell', '-NoProfile', '-Command',
                f'(Get-CimInstance Win32_Process -Filter "ProcessId={int(pid)}").CommandLine'],
                text=True, capture_output=True, check=True)
            command = result.stdout
        elif Path('/proc').is_dir():
            command = Path(f'/proc/{int(pid)}/cmdline').read_bytes().replace(b'\0', b' ').decode()
        else:
            command = subprocess.run(['ps', '-p', str(int(pid)), '-o', 'command='],
                                     text=True, capture_output=True, check=True).stdout
        return 'java' in command and str(jar) in command
    except (OSError, ValueError, subprocess.CalledProcessError):
        return False


def port_busy(port):
    with socket.socket() as connection:
        connection.settimeout(0.3)
        return connection.connect_ex(('127.0.0.1', port)) == 0


def stop_all_services(quiet=False):
    if not PID_FILE.exists():
        return 0
    records = json.loads(PID_FILE.read_text())
    remaining = {}
    stopped = 0
    for name, info in records.items():
        pid, jar = info.get('pid'), info.get('jar')
        # Un PID puede reutilizarse; el registro por sí solo no autoriza a terminar otro programa.
        if not pid or not jar or not owned_process(pid, jar):
            if not quiet:
                print(f'[AVISO] No se detiene {name}: no se verificó su identidad.')
            continue
        if kill_process(pid):
            stopped += 1
        else:
            remaining[name] = info
    if remaining:
        PID_FILE.write_text(json.dumps(remaining, indent=2))
        raise RuntimeError('No se pudieron detener todos los procesos EduSaldo registrados.')
    PID_FILE.unlink(missing_ok=True)
    return stopped


def internal_key():
    value = os.environ.get('EDUSALDO_INTERNAL_KEY')
    if value is not None:
        if len(value) < 32:
            raise RuntimeError('EDUSALDO_INTERNAL_KEY debe tener al menos 32 caracteres.')
        return value
    if KEY_FILE.exists():
        value = KEY_FILE.read_text().strip()
        if len(value) >= 32:
            return value
    return secrets.token_urlsafe(48)


def check_port_online(port, timeout=2):
    key = os.environ.get('EDUSALDO_INTERNAL_KEY')
    if not key and KEY_FILE.exists():
        key = KEY_FILE.read_text().strip()
    return ready(port, key, timeout)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--stop', action='store_true')
    parser.add_argument('--detached', '-d', action='store_true')
    args = parser.parse_args()
    handles, processes = [], []
    try:
        if args.stop:
            count = stop_all_services()
            print(f'[OK] Procesos EduSaldo verificados detenidos: {count}.')
            return 0
        environment = java_environment()
        key = internal_key()
        jars = {}
        for name, _, _ in SERVICES:
            candidates = sorted((BACKEND / name / 'target').glob('*.jar'))
            if len(candidates) != 1:
                raise RuntimeError(f'{name}: se requiere exactamente un JAR compilado, encontrados {len(candidates)}.')
            jars[name] = candidates[0].resolve()
        stop_all_services()
        occupied = [port for _, port, _ in SERVICES if port_busy(port)]
        if occupied:
            raise RuntimeError(f'Puertos ocupados por procesos ajenos o no registrados: {occupied}. No se terminaron esos procesos.')
        KEY_FILE.parent.mkdir(parents=True, exist_ok=True)
        KEY_FILE.write_text(key)
        if os.name != 'nt':
            KEY_FILE.chmod(0o600)
        environment['EDUSALDO_INTERNAL_KEY'] = key
        environment['EDUSALDO_ALLOWED_ORIGINS'] = os.environ.get('EDUSALDO_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:4173')
        log_dir = BACKEND / 'logs'
        log_dir.mkdir(exist_ok=True)
        records = {}
        for name, port, database in SERVICES:
            output = (log_dir / f'{name}.log').open('w', encoding='utf-8')
            handles.append(output)
            service_env = environment.copy()
            if database:
                service_env['SPRING_DATASOURCE_URL'] = ('jdbc:mysql://' + os.environ.get('EDUSALDO_DB_HOST', '127.0.0.1') + ':' + os.environ.get('EDUSALDO_DB_PORT', '3306') + '/' + database + '?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC')
                service_env['SPRING_DATASOURCE_USERNAME'] = os.environ.get('EDUSALDO_DB_USER', 'root')
                service_env['SPRING_DATASOURCE_PASSWORD'] = os.environ.get('EDUSALDO_DB_PASSWORD', '')
            kwargs = {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP} if os.name == 'nt' else {'start_new_session': True}
            process = subprocess.Popen(['java', '-jar', str(jars[name])], cwd=BACKEND / name,
                                       env=service_env, stdout=output, stderr=output, **kwargs)
            processes.append(process)
            records[name] = {'pid': process.pid, 'port': port, 'jar': str(jars[name])}
            PID_FILE.write_text(json.dumps(records, indent=2))
            print(f'[START] {name}: {process.pid}')
        deadline = time.monotonic() + 90
        waiting = {port for _, port, _ in SERVICES}
        while waiting and time.monotonic() < deadline:
            if any(process.poll() is not None for process in processes):
                raise RuntimeError('Un servicio terminó antes de estar disponible. Revisa backend/logs.')
            waiting = {port for port in waiting if not ready(port, key)}
            if waiting:
                time.sleep(0.5)
        if waiting:
            raise RuntimeError(f'No superaron la comprobación de salud: {sorted(waiting)}.')
        print('[OK] Gateway y cuatro servicios listos. Entrada pública: http://localhost:8090')
        if args.detached:
            return 0
        print('Ctrl+C para detener los procesos registrados. Logs: backend/logs')
        while all(process.poll() is None for process in processes):
            time.sleep(0.5)
        raise RuntimeError('Un servicio terminó durante la ejecución.')
    except KeyboardInterrupt:
        stop_all_services()
        return 0
    except (OSError, RuntimeError, ValueError) as error:
        print(f'[ERROR] {error}', file=sys.stderr)
        if processes:
            stop_all_services()
        return 1
    finally:
        for output in handles:
            output.close()


if __name__ == '__main__':
    sys.exit(main())
