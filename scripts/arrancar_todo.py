#!/usr/bin/env python3
"""Lanzador Unificado de EduSaldo para Presentación Académica.

Orquesta la reconstrucción de bases de datos, el levantamiento del backend
en segundo plano y el arranque del frontend abriendo el navegador.
Al presionar Ctrl+C, detiene automáticamente todos los procesos registrados.
"""

import argparse
import os
from pathlib import Path
import subprocess
import sys
import time
import webbrowser

# Reconfigurar stdout/stderr con UTF-8 para consolas Windows
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = ROOT / 'scripts'


def banner():
    print("=" * 78)
    print("  EDUSALDO · PLATAFORMA DE LIBRERÍA ESCOLAR Y GESTIÓN DE SALDOS")
    print("  Puesta en Marcha Rápida (Multiplataforma: Windows / Linux / macOS)")
    print("=" * 78)


def main():
    parser = argparse.ArgumentParser(description="Iniciador unificado de EduSaldo")
    parser.add_argument('--stop', action='store_true', help="Detener todos los servicios backend")
    parser.add_argument('--skip-db', action='store_true', help="Omitir el reset de bases de datos")
    parser.add_argument('--build', action='store_true', help="Forzar compilación con Maven antes de iniciar")
    args = parser.parse_args()

    stop_script = SCRIPTS_DIR / '2_arrancar_servicios.py'

    if args.stop:
        subprocess.run([sys.executable, str(stop_script), '--stop'])
        return 0

    banner()

    try:
        # 1. Reset y carga de seeds de Base de Datos
        if not args.skip_db:
            print("\n>>> [PASO 1/3] Configurando bases de datos MySQL y cargando semillas iniciales...")
            db_script = SCRIPTS_DIR / '1_reset_bases_datos.py'
            res = subprocess.run([sys.executable, str(db_script)])
            if res.returncode != 0:
                print("\n[ERROR] Falló la configuración de la base de datos.")
                print("Asegúrate de que MySQL esté activo en el puerto 3306 (ej. en el panel de XAMPP).")
                return 1
        else:
            print("\n>>> [PASO 1/3] Omitiendo configuración de base de datos (--skip-db)...")

        # 2. Arranque del Backend (Gateway + 4 microservicios)
        print("\n>>> [PASO 2/3] Iniciando backend (Gateway 8090 + 4 microservicios)...")
        backend_script = SCRIPTS_DIR / '2_arrancar_servicios.py'
        backend_cmd = [sys.executable, str(backend_script), '--detached']
        if args.build:
            backend_cmd.append('--build')

        res_backend = subprocess.run(backend_cmd)
        if res_backend.returncode != 0:
            print("\n[ERROR] No se pudo iniciar el backend. Revisa los logs en backend/logs/.")
            return 1

        # 3. Lanzar frontend y abrir navegador
        print("\n>>> [PASO 3/3] Iniciando frontend web (React + Vite)...")
        print("La aplicación estará disponible en: http://localhost:5173")
        print("Presiona Ctrl+C en cualquier momento para detener todos los servicios.\n")

        # Intentar abrir el navegador automáticamente tras 1 segundo
        try:
            time.sleep(1)
            webbrowser.open("http://localhost:5173")
        except Exception:
            pass

        frontend_script = SCRIPTS_DIR / '3_arrancar_frontend.py'
        subprocess.run([sys.executable, str(frontend_script)])

    except KeyboardInterrupt:
        print("\n\n[INFO] Señal de detención recibida. Finalizando procesos...")
    finally:
        print("[INFO] Deteniendo servicios backend para liberar puertos 8090..8094...")
        subprocess.run([sys.executable, str(stop_script), '--stop'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("[OK] Todos los servicios han sido detenidos correctamente.")

    return 0


if __name__ == '__main__':
    sys.exit(main())
