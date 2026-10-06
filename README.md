# EduSaldo - Librería Escolar Digital

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

## Equipo

- Integrante 1: Pamela Acuña
- Integrante 2: Antonio Jara
- Integrante 3: Florencia Soto

## Problema

Cuando los aportes, compras y saldos se gestionan mediante registros manuales o planillas independientes, los apoderados no siempre pueden consultar de manera inmediata los movimientos asociados a sus alumnos. Falta un sistema centralizado que permita consultar oportunamente los aportes, compras, saldos y movimientos de cada alumno, y que facilite el control administrativo de la librería escolar.

## Solución propuesta

**EduSaldo** es una aplicación web que gestiona una librería escolar, sus productos y usuarios, junto con la administración de estudiantes, aportes de saldo mediante Webpay (simulado), compras, reservas, movimientos e inventario.

## Objetivo general

Desarrollar una aplicación web para gestionar una librería escolar y centralizar el registro de productos, usuarios, compras y saldos asociados a estudiantes, utilizando HTML, CSS y JavaScript, con el propósito de mejorar la trazabilidad, transparencia y control de las operaciones.

## Organización y roles

- **Organización:** Centro General de Padres y Apoderados (Centro de Padres), que administra los fondos y es responsable de la librería escolar, donde se realizan las compras y entregas de materiales.
- **Sistema:** EduSaldo.
- **Apoderado:** aporta saldo a sus alumnos con Webpay, consulta sus movimientos y reserva materiales.
- **Encargado de Librería:** gestiona stock, prepara reservas y entrega materiales.
- **Administrador:** administra usuarios, estudiantes, productos y la configuración del sistema.
- **Administrador 2 (autorizador):** perfil de control y segunda firma; consulta la Cuenta Librería en modo solo lectura y autoriza ajustes de stock y pagos.
- **Alumno (estudiante):** entidad del dominio; tiene saldo disponible y no requiere inicio de sesión.

## Conceptos

- **Aporte:** dinero que el apoderado incorpora, mediante Webpay, al saldo de uno de sus alumnos.
- **Saldo disponible:** dinero que tiene el alumno para comprar materiales.
- **Compra:** adquisición de materiales en la librería escolar; descuenta el saldo.
- **Reserva:** selección anticipada de materiales para retirarlos después; se convierte en compra al retirarla.
- **Movimiento:** registro de un aporte, compra u otra operación que afecta el saldo.

Flujo del aporte: *Aportar saldo* → elegir alumno → ingresar monto → pago en Webpay → al aprobarse, el monto se acredita al saldo del alumno → queda registrado como movimiento. Webpay está **simulado**: no hay pasarela real ni se piden datos de tarjeta.

## Planificación del semestre

El prototipo actual cubre la estructura navegable y las reglas de negocio demostrables (Sprints 1–4); los Sprints 5–12 corresponden a la migración a React + TypeScript, el testing y la integración con Spring Boot.

| Sprint | Experiencia | Sprint Goal | PBIs / entregables lógicos mínimos | Tecnología / aprendizaje | Trabajo paralelo | Definition of Done mínima / criterio de cierre | Sprint Review: evidencia a demostrar |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| 12 | E3 | Proteger y cerrar la solución Full Stack | Login; JWT; roles CLIENTE/ADMIN; persistencia de sesión; rutas/acciones restringidas; pago simulado; cierre funcional. | Spring Security + JWT + React + Axios | Integración final y estabilización. | Autenticación y autorización operativas; sesión persiste tras recarga; frontend y backend restringen según rol. | Demostrar login, token, persistencia de sesión, acceso Cliente/Admin, rechazo de accesos indebidos y solución final integrada. |
