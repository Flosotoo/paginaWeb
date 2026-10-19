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

## Planificación del semestre

El prototipo inicial cubrió la estructura navegable y las reglas de negocio demostrables (Sprints 1–4); los Sprints 5–12 corresponden a la migración a React + TypeScript, el testing y la integración con Spring Boot.

| Sprint | Experiencia | Sprint Goal | PBIs / entregables lógicos mínimos | Tecnología / aprendizaje | Trabajo paralelo | Definition of Done mínima / criterio de cierre | Sprint Review: evidencia a demostrar |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | E1 | Definir el producto y organizar el desarrollo | Actores Cliente/Admin; alcance; Product Backlog; HU o casos de uso; criterios de aceptación; ERS inicial; repositorio Git; estimación inicial con SP. | Scrum, Git/GitHub, análisis de requerimientos | Definición preliminar de entidades, roles y funcionalidades futuras. | Backlog priorizado; criterios de aceptación verificables; repositorio operativo; trabajo distribuido y visible en Git. | Presentar problema, alcance, backlog, criterios de aceptación, estimaciones relativas, organización del equipo y commits iniciales. |
| 2 | E1 | Construir la estructura navegable de la tienda | Home; catálogo; detalle de producto; formularios; navegación; imágenes/multimedia; footer; estructura inicial cliente/admin. | HTML5 semántico | Refinamiento del Product Backlog y de criterios de aceptación. | Navegación funcional y estructura semántica coherente con los requerimientos. | Recorrer el sitio; justificar etiquetas semánticas; mostrar navegación, formularios, recursos y commits del sprint. |
| 3 | E1 | Diseñar la interfaz de cliente y administración | Diseño visual; catálogo; formularios; vistas cliente/admin; adaptación móvil/escritorio. | CSS externo + Bootstrap | Refinamiento de interfaz y backlog. | CSS personalizado externo; Bootstrap integrado; interfaz usable y responsive. | Mostrar escritorio/móvil; distinguir Bootstrap de CSS propio; justificar decisiones visuales y evidenciar trabajo en Git. |
| 4 | E1 | Incorporar validaciones y cerrar el sitio base | Formularios; validaciones; mensajes de error/sugerencias; comportamiento JavaScript requerido por EP1. El carrito JS NO es entregable del proyecto. | JavaScript para validaciones y comportamiento requerido | Diseño funcional del carrito que posteriormente se implementará en TypeScript. | Casos válidos e inválidos operativos; mensajes claros; trazabilidad con criterios de aceptación; historial Git acumulado. | Demostrar validaciones positivas/negativas, criterio de aceptación asociado, código JS y participación sostenida del equipo. |
| 5 | E2 | Transformar la solución en una SPA React tipada | Proyecto React; estructura pages/components/models/services; modelos TypeScript; layout; primeras vistas migradas. | React + TypeScript + SWC + Bootstrap | Preparación del proyecto Spring Boot. | SPA ejecutable; TypeScript usado realmente; estructura coherente; primera migración funcional. | Mostrar SPA; explicar estructura; demostrar interfaces/types y diferencia entre sitio tradicional y SPA. |
| 6 | E2 | Construir una interfaz componentizada y reutilizable | ProductCard, ProductList, Navbar, componentes de administración; props tipadas; composición y reutilización. | React + TypeScript: componentes, props e interfaces | Spring Boot: conexión BD, entidades y modelo. | Componentes reutilizables; props tipadas; Bootstrap responsive; separación página/componente. | Demostrar reutilización, props, interfaces/types, composición, responsive y avance paralelo del modelo backend. |
| 7 | E2 | Implementar la lógica propia del carrito en TypeScript | Carrito creado por los estudiantes en TS: agregar, eliminar, modificar cantidad, subtotal, total, vaciar e inicio de checkout. | TypeScript + React: useState, eventos, formularios y lógica tipada | Spring Boot: Repository, Service y lógica de negocio. | Carrito funcional escrito en TypeScript; modelos Producto/ItemCarrito tipados; operaciones coherentes con criterios de aceptación. | Demostrar carrito completo, cambios de estado, funciones TS, modelos tipados y criterios de aceptación satisfechos. |
| 8 | E2 | Consolidar la tienda como SPA cliente/admin | Router; Home; catálogo; detalle; carrito; checkout; login; administración; parámetros de ruta; 404. | React Router + TypeScript + Bootstrap | Spring Boot: Controllers y endpoints REST iniciales. | Navegación SPA sin reload; rutas y parámetros; cliente/admin integrados; carrito TS integrado; responsive global. | Recorrer la SPA completa; demostrar rutas, parámetros, componentes, estado, carrito TS y diseño responsive. |
| 9 | E2 | Verificar los comportamientos críticos del frontend | Primer conjunto de pruebas derivadas de HU y criterios de aceptación: carrito, formularios y componentes. | Vitest + React Testing Library | Spring Boot: completar CRUD. | Pruebas ejecutables y trazables a criterios de aceptación; casos positivos y negativos. | Ejecutar tests; explicar CA -> test; mostrar casos exitosos y un fallo controlado. |
| 10 | E2 | Consolidar el proceso de testing | 10 pruebas relevantes; mocks; coverage; análisis de resultados; documento de cobertura. | Vitest + RTL + mocks + coverage | Spring Boot: CRUD completo, Swagger y API estable. | 10 pruebas significativas ejecutables; mocks cuando corresponda; cobertura disponible y analizada. | Ejecutar suite completa; demostrar 10 tests, mocks, coverage y explicar alcance y resultados. |
| 11 | E3 | Integrar la SPA con el backend real | Sustituir datos locales/mocks; catálogo real; CRUD admin; pedidos/checkout; endpoints; Swagger. | Axios + REST + Spring Boot + Base de Datos | Implementación de Spring Security y JWT. | Flujos GET/POST/PUT/DELETE integrados; Swagger disponible; frontend consume API real mediante Axios. | Demostrar React -> Axios -> REST -> Spring -> BD -> respuesta; CRUD completo; Swagger; lógica y modelo backend. |
| 12 | E3 | Proteger y cerrar la solución Full Stack | Login; JWT; roles CLIENTE/ADMIN; persistencia de sesión; rutas/acciones restringidas; pago simulado; cierre funcional. | Spring Boot + Spring Security + JWT + React + Axios | Integración final y estabilización. | Autenticación y autorización operativas; sesión persiste tras recarga; frontend y backend restringen según rol. | Demostrar login, token, persistencia de sesión, acceso Cliente/Admin, rechazo de accesos indebidos y solución final integrada. |