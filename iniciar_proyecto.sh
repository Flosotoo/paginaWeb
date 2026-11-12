#!/usr/bin/env bash
# =============================================================================
# EduSaldo - Puesta en Marcha (Linux / macOS)
# =============================================================================
cd "$(dirname "$0")" || exit 1

echo "============================================================================="
echo "  EDUSALDO - INICIANDO PROYECTO COMPLETO"
echo "  Asegúrate de tener MySQL y Apache iniciados en tu equipo."
echo "============================================================================="

if command -v python3 &>/dev/null; then
    python3 scripts/arrancar_todo.py "$@"
elif command -v python &>/dev/null; then
    python scripts/arrancar_todo.py "$@"
else
    echo "[ERROR] No se encontró Python 3 instalado en el sistema."
    exit 1
fi
