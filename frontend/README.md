# EduSaldo - Librería Escolar Digital

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

## Equipo

- Integrante 1: Pamela Acuña
- Integrante 2: Antonio Jara
- Integrante 3: Florencia Soto

## Problema

Cuando los abonos, entregas y saldos se gestionan mediante registros manuales o planillas independientes, los apoderados no siempre pueden consultar de manera inmediata los movimientos asociados a sus alumnos. Falta un sistema centralizado que permita consultar oportunamente los abonos, entregas, saldos y movimientos de cada alumno, y que facilite el control administrativo y operativo de la librería escolar.

## Solución propuesta

**EduSaldo** es una aplicación web que gestiona una librería escolar, su catálogo de productos y usuarios, junto con la administración de estudiantes, abonos de saldo mediante pasarela Webpay (simulada), reservas, entregas de materiales, movimientos e inventario.

## Objetivo general

Desarrollar una aplicación web para gestionar una librería escolar y centralizar el registro de productos, usuarios, entregas de materiales y saldos asociados a estudiantes, utilizando HTML, CSS, JavaScript y React en el frontend, y Spring Boot bajo arquitectura de microservicios en el backend, con el propósito de mejorar la trazabilidad, transparencia y control de las operaciones.

## Organización y roles

- **Organización:** Centro General de Padres y Apoderados (Centro de Padres), que administra los fondos y es responsable de la librería escolar, donde se gestionan los materiales.
- **Sistema:** EduSaldo.
- **Apoderado:** abona saldo a sus alumnos con Webpay (simulado), consulta sus movimientos y reserva materiales para cualquiera de sus pupilos.
- **Encargado de Librería:** gestiona stock físico, registra ingresos manuales de mercadería, prepara reservas rotuladas (`preparadaPorId`, `fechaPreparacion`), entrega materiales en mesón y solicita ajustes de inventario.
- **Administrador:** gestiona usuarios, alumnos, asociaciones familiares, catálogo de productos, aprueba o rechaza solicitudes de ajuste de stock y administra los parámetros y configuración institucional del sistema.
- **Alumno (estudiante):** entidad del dominio con saldo individual (`alumnoId`). Si tiene 12 años o más, cuenta con inicio de sesión propio (correo institucional), puede consultar su saldo y gestionar reservas para sí mismo. Si es menor de 12 años, no inicia sesión y opera mediante sus apoderados o identificación presencial en el mesón.

## Conceptos

- **Abono:** dinero que el apoderado incorpora, mediante pasarela Webpay simulada, al saldo de uno de sus alumnos.
- **Saldo disponible:** fondos reales que tiene el alumno para retirar materiales (`saldoDisponible = saldoActual - saldoComprometido`).
- **Reserva:** selección anticipada de materiales para retirarlos posteriormente; compromete saldo y stock físico, es preparada y rotulada por el encargado, y se concreta en una entrega al momento del retiro.
- **Entrega de materiales:** acto de despacho presencial de artículos (por retiro de reserva o atención en mesón) que descuenta formalmente el saldo y el stock físico.
- **Movimiento de saldo / inventario:** registro inmutable de auditoría para cada operación que afecta el saldo o el stock.

Flujo del abono: *Abonar saldo* → elegir alumno → ingresar monto → pasarela simulada con token → cuenta temporalmente bloqueada → al aprobarse, se acredita en `CuentaSaldo` y se genera `MovimientoSaldo` → desbloqueo de cuenta. Webpay está **simulado**: no hay pasarela real ni se solicitan datos bancarios reales.

## Arquitectura de Microservicios (Backend EduSaldo)

La solución se estructura bajo el patrón Domain-Driven Design (DDD) en **4 microservicios de negocio desacoplados** más un **API Gateway** central en topología de estrella (Hub & Spoke):

1. **MS Auth y Usuarios (8091 · `db_usuarios`):** Autenticación JWT, jerarquía polimórfica de usuarios (`Administrador`, `Encargado`, `Apoderado`, `Alumno`), clase de asociación pura `ApoderadoAlumno`, política de acceso con bloqueo dinámico tras intentos fallidos, configuración institucional, parámetros del sistema y registro centralizado de auditoría.
2. **MS Saldos y Abonos (8092 · `db_saldos`):** Cuentas de saldo por alumno (`alumnoId`), invariante financiera (`saldoDisponible >= 0`), abonos Webpay simulados con bloqueo temporal, liquidación por retiro del alumno y bitácora inmutable de `MovimientoSaldo`.
3. **MS Productos e Inventario (8093 · `db_inventario`):** Catálogo de productos, categorías, stock físico, reservado y disponible, módulo de ingreso manual de stock y solicitudes de ajuste de stock solicitadas por el Encargado y aprobadas por el Administrador.
4. **MS Reservas y Entregas (8094 · `db_reservas`):** Ciclo de reservas multilínea con trazabilidad de preparación (HU31 CA2: `preparadaPorId`, `fechaPreparacion`), cancelaciones permitidas para staff, apoderados y alumnos $\ge$ 12 años, entregas en mesón, devoluciones de materiales y notificación interna por correo a apoderados.
- **API Gateway (8090):** Punto único de entrada para el frontend React, encargado del enrutamiento perimetral y la seguridad sin lógica de negocio propia.

*(Nota: Los anteriores módulos de Compras 8085 y Finanzas 8086 fueron desestimados para evitar sobreingeniería y ajustar el alcance a los requerimientos evaluativos del curso).*
