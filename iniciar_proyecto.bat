@echo off
title EduSaldo - Puesta en Marcha
cd /d "%~dp0"
echo =============================================================================
echo   EDUSALDO - INICIANDO PROYECTO COMPLETO
echo   Asegurate de tener XAMPP (Apache y MySQL) iniciado en tu equipo.
echo =============================================================================
python scripts\arrancar_todo.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Ocurrio un problema al iniciar EduSaldo.
    pause
)
