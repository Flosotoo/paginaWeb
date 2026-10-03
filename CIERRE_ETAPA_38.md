# EduSaldo 2.0 — Cierre Etapa 38

Fuente funcional: backlog maestro depurado + 8 cierres funcionales aprobados.

## Incorporado al prototipo
1. Onboarding: carga manual y CSV de cuentas familiares/alumnos, sin duplicar RUT.
2. Cuenta familiar 1:N alumnos; saldo individual; estados e inactivación.
3. Seguridad funcional: PRIMER_ACCESO, contraseña temporal, cambio, bloqueo 5 intentos, reset administrativo.
4. Reserva: compromiso de saldo/stock; preparación; LISTA_PARA_RETIRO; entrega; cancelación previa con motivo; devolución posterior.
5. Sin saldo negativo. Umbral bajo configurable; aviso persistente y un evento de correo simulado por episodio.
6. CPP/recepción/precio: se mantiene el flujo de compras/recepciones/valorización de Etapa 37.4; el precio de venta continúa bajo control administrativo.
7. Períodos: ABIERTO, EN_REVISION, CERRADO; cierre manual o automático según días configurados.
8. Auditoría: acciones sensibles trazables y registros operativos conservados.

## Planificación de desarrollo
Sprints 1–4: este prototipo cubre la estructura navegable, interfaz, validaciones y reglas de negocio demostrables.
Sprints 5–10: la migración a React + TypeScript y las pruebas Vitest/RTL se implementarán en la etapa frontend tipada.
Sprints 5–10 (trabajo paralelo): Spring Boot, BD, Repository/Service, Controllers, CRUD, Swagger/API estable se implementarán al construir los microservicios.
Sprints 11–12: Axios/REST, datos reales, Spring Security/JWT, roles y estabilización se ejecutarán al integrar frontend y backend.

Este documento no declara implementadas tecnologías que aún no existen en el ZIP; define la frontera exacta entre el prototipo funcional cerrado y la siguiente etapa técnica.
