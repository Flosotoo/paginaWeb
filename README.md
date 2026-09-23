# EduSaldo 2.0 — Etapa 12: Aportar saldo

Abre `index.html` con Live Server en VS Code. Acceso de demostración: `apoderado@edusaldo.cl` / `1234`.

## Flujo

1. Inicia sesión, elige a Sofía o Tomás y selecciona **Aportar saldo**.
2. Ingresa un monto positivo entero en CLP y revisa el saldo proyectado.
3. Continúa a **Webpay (simulación)** y elige **Simular pago aprobado** o **Simular pago rechazado**.
4. Solo un resultado aprobado registra un movimiento y aumenta el saldo en `localStorage`.
5. Regresa a la cuenta o abre la cartola; el resumen familiar muestra los últimos cinco movimientos cronológicos de ambos alumnos.

**No hay integración con Webpay ni transacciones reales.** Las credenciales son ficticias, la sesión es de demostración y los datos se guardan únicamente en el navegador/dispositivo actual. No introducir información bancaria real. Reservas, entrega y devoluciones aún están pendientes.

Para restablecer los datos de prueba, borra el almacenamiento local de este sitio (clave `edusaldo2_demo`) y recarga la página. La aplicación no sincroniza datos entre navegadores ni dispositivos.


## Etapa 13 · Aporte corregido
El monto se formatea en CLP con separadores de miles y requiere confirmación explícita antes de continuar al Webpay simulado. El saldo solo cambia tras aprobar la simulación y se registra un movimiento en localStorage. La cabecera del alumno es más compacta. Para probar, usa Live Server y recarga la nueva carpeta del proyecto; no mezcles archivos de etapas anteriores.
