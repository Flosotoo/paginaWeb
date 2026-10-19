# =============================================================================
# Propósito: Instala dependencias (si faltan) y arranca el frontend en Vite (puerto 5173).
# Ejecución: python frontend/arrancar_frontend.py
# =============================================================================

import os
import subprocess
import sys

FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

print("=============================================================================")
print("  EDUSALDO - INICIANDO FRONTEND WEB (REACT + VITE)")
print("=============================================================================")
print(f"Directorio: {FRONTEND_DIR}\n")

os.chdir(FRONTEND_DIR)

# 1. Comprobar node_modules
node_modules = os.path.join(FRONTEND_DIR, "node_modules")
if not os.path.exists(node_modules):
    print("[1/2] Carpeta node_modules no encontrada. Instalando dependencias con npm install...")
    try:
        subprocess.run(["npm", "install"], check=True, shell=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Error al instalar dependencias: {e}")
        sys.exit(1)
else:
    print("[1/2] Dependencias node_modules encontradas.")

# 2. Iniciar servidor Vite
print("[2/2] Iniciando servidor de desarrollo en http://localhost:5173...")
try:
    subprocess.run(["npm", "run", "dev"], check=True, shell=True)
except KeyboardInterrupt:
    print("\n[INFO] Servidor frontend detenido por el usuario.")
except subprocess.CalledProcessError as e:
    print(f"[ERROR] Error al ejecutar npm run dev: {e}")
    sys.exit(e.returncode)
