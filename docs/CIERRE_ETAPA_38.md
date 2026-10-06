# EduSaldo 2.0 — Actualizaciones: Etapas 37.4 y 38

Documento consolidado de los cierres funcionales del prototipo HTML/CSS/JavaScript previo a Spring Boot y React.

---

## Etapa 37.4 definitiva

Cierre del prototipo HTML/CSS/JavaScript antes de Spring Boot y React.

Correcciones finales del Administrador:

- Dashboard alineado visualmente con Apoderado y Encargado.
- Cuenta Librería con retorno al Inicio.
- Inventario y Valorización con solo tres accesos: Creación de Productos, Stock e Inventario.
- Creación de Productos sin listado inferior.
- Stock con Stock valorizado, Stock crítico y Ajuste de stock.
- Stock crítico muestra solo avisos vigentes, del más antiguo al más nuevo.
- Ajuste de stock funcional con motivo y doble autorización.
- Inventarios realizados como histórico con respaldo fotográfico y filtro por año.
- Gestión de Compras con solo Crear Orden de Compra y Maestro de Proveedores.
- Navegación Volver corregida.

Se mantienen las reglas aprobadas de OC, recepción por Encargada, CPP con IVA incluido, facturas, pagos sin parcialidades y doble autorización.

**Etapa 37.4 final - permisos Administrador 2:** acceso solo a Cuenta Librería en modo consulta, autorizaciones pendientes de ajustes de stock/pagos e historial de sus autorizaciones. No tiene acceso a funciones operativas del Administrador 1.

---

## Etapa 38 — cierre funcional previo a microservicios

Fuente funcional: backlog maestro depurado + 8 cierres funcionales aprobados.

Esta versión incorpora al prototipo navegable las reglas funcionales cerradas del backlog maestro EduSaldo 2.0:

1. **Onboarding:** carga manual y CSV de cuentas familiares/alumnos, sin duplicar RUT.
2. **Cuenta familiar 1:N alumnos:** saldo individual; estados e inactivación.
3. **Seguridad funcional:** PRIMER_ACCESO, contraseña temporal, cambio, bloqueo a 5 intentos, reset administrativo.
4. **Reserva:** compromiso de saldo/stock; preparación; LISTA_PARA_RETIRO; entrega; cancelación previa con motivo; devolución posterior.
5. **Sin saldo negativo.** Umbral bajo configurable ($3.000 inicial); aviso persistente y un evento de correo simulado por episodio.
6. **CPP/recepción/precio:** se mantiene el flujo de compras/recepciones/valorización de Etapa 37.4; el precio de venta continúa bajo control administrativo.
7. **Períodos:** ABIERTO, EN_REVISION, CERRADO; cierre manual o automático según días configurados (3 días iniciales).
8. **Auditoría:** acciones sensibles trazables y registros operativos conservados; inactivación en lugar de borrado de registros con historial.

Resumen adicional de reglas cerradas:

- alta administrativa de cuentas familiares y alumnos, importación CSV y estados ACTIVO/INACTIVO;
- sin autorregistro; contraseña temporal, PRIMER_ACCESO, cambio obligatorio, bloqueo a 5 intentos y restablecimiento administrativo;
- una cuenta familiar puede agrupar varios alumnos, cada uno con saldo e historial independiente;
- reservas con saldo/stock comprometido; estados PENDIENTE → EN_PREPARACION/ETIQUETA → LISTA_PARA_RETIRO → ENTREGADA, con CANCELADA antes de entrega;
- la entrega finaliza venta/saldo/stock; una entrega no se cancela: se usa devolución;
- saldo negativo prohibido en reserva y entrega directa;
- alerta persistente de saldo bajo con umbral configurable ($3.000 inicial) y un solo evento de correo simulado por episodio;
- compras, recepciones parciales, inventario, CPP/valorización, precios administrados, pagos con autorización y Cuenta Librería conservados desde Etapa 37.4;
- cierre financiero mensual ABIERTO → EN_REVISION → CERRADO, manual o automático tras plazo configurable (3 días iniciales);
- auditoría de acciones sensibles de solo lectura e inactivación en lugar de borrado de registros con historial.

---

## Planificación de desarrollo

- **Sprints 1–4:** este prototipo cubre la estructura navegable, interfaz, validaciones y reglas de negocio demostrables.
- **Sprints 5–10:** la migración a React + TypeScript y las pruebas Vitest/RTL se implementarán en la etapa frontend tipada.
- **Sprints 5–10 (trabajo paralelo):** Spring Boot, BD, Repository/Service, Controllers, CRUD, Swagger/API estable se implementarán al construir los microservicios.
- **Sprints 11–12:** Axios/REST, datos reales, Spring Security/JWT, roles y estabilización se ejecutarán al integrar frontend y backend.

---

## Alcance técnico de este ZIP

Este ZIP sigue siendo el prototipo frontend académico HTML/CSS/JavaScript con persistencia local. Los elementos de la planificación E2/E3 que exigen React + TypeScript, Vitest/RTL, Axios, Spring Boot, REST, base de datos, Spring Security/JWT y Swagger pertenecen a la siguiente etapa de implementación. No se simula que esas tecnologías ya existan: este cierre congela el comportamiento funcional que deberá migrarse a esa arquitectura.

Este documento no declara implementadas tecnologías que aún no existen en el ZIP; define la frontera exacta entre el prototipo funcional cerrado y la siguiente etapa técnica.
