# EduSaldo - Plataforma de Librería Escolar y Gestión de Saldos

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

### Equipo de Desarrollo
- **Pamela Acuña**
- **Antonio Jara**
- **Florencia Soto**

---

**EduSaldo** es una solución integral diseñada para digitalizar y controlar las operaciones de librerías escolares. Permite a los apoderados recargar saldos prepagados, a los alumnos retirar o reservar útiles de forma autónoma, y al personal de librería despachar entregas y controlar inventarios con trazabilidad estricta.

La plataforma está construida bajo una **arquitectura de microservicios en Spring Boot**, un **API Gateway central**, un frontend en **React y TypeScript** y persistencia con **MySQL**.

---

## Estructura del Repositorio (Monorepo)

```text
EduSaldo/
├── docs/                                  <- Documentación Centralizada
│   ├── README.md                          <- Documento arquitectura y requerimientos
│   ├── EduSaldo - Arquitectura...docx     <- Documento de arquitectura
│   ├── EduSaldo - Plantilla...xlsx        <- Planilla de requerimientos
│   └── diagramas/                         <- Diagramas de arquitectura y flujos (.md)
│       ├── mermaid-arquitectura-general.md
│       ├── mermaid-comunicaciones-internas.md
│       ├── mermaid-ms-usuarios-8091.md
│       ├── mermaid-ms-saldos-abonos-8092.md
│       ├── mermaid-ms-productos-inventario-8093.md
│       └── mermaid-ms-reservas-entregas-8094.md
│
├── frontend/                              <- SPA Web en React + TypeScript
│   ├── src/                               <- Componentes, páginas por rol y servicios API
│   ├── arrancar_frontend.ps1 / .py        <- Script de inicio rápido del frontend
│   ├── package.json
│   └── vite.config.ts
│
└── backend/                               <- Ecosistema Backend en Spring Boot
    ├── edusaldo-api-gateway/              <- Puerto 8090 · Punto único de entrada (Spring Cloud Gateway)
    ├── edusaldo-ms-auth-usuarios/         <- Puerto 8091 · Identidad, JWT y usuarios (db_usuarios)
    ├── edusaldo-ms-alumnos-saldos/        <- Puerto 8092 · Cuentas de saldo y abonos (db_saldos)
    ├── edusaldo-ms-productos-inventario/  <- Puerto 8093 · Catálogo y control de stock (db_inventario)
    ├── edusaldo-ms-ventas-reservas/       <- Puerto 8094 · Reservas, entregas y devoluciones (db_reservas)
    └── scripts/                           <- Herramientas de arranque y de pruebas
        ├── README.md                      <- Guía de Swagger y documentación de scripts
        ├── arrancar_servicios.ps1 / .py   <- Arranque concurrente de los 5 servicios
        ├── reset_bases_datos.ps1 / .py    <- Borrado de las BD y creación de esquemas MySQL
        ├── pruebas_http_automaticas.*     <- Pruebas E2E automatizadas
        └── pruebas_postman_coleccion.json <- Colección Postman preconfigurada
```

---

## Puertos y Servicios

| Componente | Carpeta | Puerto | Base de Datos | Swagger UI / URL |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend Web (React)** | `frontend/` | **5173** | N/A (consume 8090) | `http://localhost:5173` |
| **API Gateway Central** | `backend/edusaldo-api-gateway/` | **8090** | N/A (enrutamiento) | `http://localhost:8090` |
| **MS Auth y Usuarios** | `backend/edusaldo-ms-auth-usuarios/` | **8091** | `db_usuarios` | `http://localhost:8091/swagger-ui.html` |
| **MS Alumnos y Saldos** | `backend/edusaldo-ms-alumnos-saldos/` | **8092** | `db_saldos` | `http://localhost:8092/swagger-ui.html` |
| **MS Productos e Inventario** | `backend/edusaldo-ms-productos-inventario/` | **8093** | `db_inventario` | `http://localhost:8093/swagger-ui.html` |
| **MS Reservas y Entregas** | `backend/edusaldo-ms-ventas-reservas/` | **8094** | `db_reservas` | `http://localhost:8094/swagger-ui.html` |

---

## Guía de Puesta en Marcha

### Prerrequisitos
- **Java 17 o superior** y **Maven 3.8+**
- **Node.js v20+** y **npm v10+**
- **MySQL 8.0** o **XAMPP MySQL** en el puerto 3306

---

### Paso 1: Configurar las Bases de Datos MySQL
Ejecuta el script de reinicio para crear las 4 bases de datos canónicas limpias con sus tablas y datos iniciales:
```powershell
.\backend\scripts\reset_bases_datos.ps1
```
*(O ejecuta `python backend/scripts/reset_bases_datos.py`)*

---

### Paso 2: Levantar el Backend (Gateway + 4 Microservicios)
Ejecuta el script de arranque simultáneo:
```powershell
.\backend\scripts\arrancar_servicios.ps1
```
*(O ejecuta `python backend/scripts/arrancar_servicios.py`)*

El script levantará concurrentemente los servicios en segundo plano y confirmará en consola cuando los 5 puertos (`8090`, `8091`, `8092`, `8093`, `8094`) estén respondiendo.

---

### Paso 3: Levantar el Frontend Web
Ejecuta el script de arranque del frontend:
```powershell
.\frontend\arrancar_frontend.ps1
```
*(O ejecuta `python frontend/arrancar_frontend.py` o directamente `cd frontend && npm install && npm run dev`)*

Abre tu navegador en `http://localhost:5173`.

---

## Pruebas del Sistema

Toda la suite de pruebas se encuentra centralizada en [`backend/scripts/`](backend/scripts/):
- **Pruebas Automatizadas E2E:** `python backend/scripts/pruebas_http_automaticas.py`
- **Colección Postman:** Importa `backend/scripts/pruebas_postman_coleccion.json` en Postman.
- **Guía de Pruebas Manuales Swagger UI:** Consulta [`backend/scripts/README.md`](backend/scripts/README.md#4-pruebas-manuales-en-swagger-ui) con casos de uso y JSONs listos para copiar y pegar.

---

## Planificación del Semestre y Criterios Evaluativos

El desarrollo de EduSaldo sigue el marco de trabajo Scrum dividido en 12 Sprints a lo largo de 3 Experiencias de Aprendizaje:

- **Experiencia 1 (Sprints 1–4):** Definición de requerimientos, diseño UI base (HTML/CSS/JS) y prototipado.
- **Experiencia 2 (Sprints 5–10):** Migración completa a SPA tipada en React + TypeScript, componentes reutilizables, carrito y suite de testing con Vitest/RTL.
- **Experiencia 3 (Sprints 11–12):** Integración Full Stack con microservicios Spring Boot, Spring Security, JWT y validación final de reglas de negocio.

| Sprint | Experiencia | Sprint Goal | PBIs / entregables lógicos mínimos | Tecnología / aprendizaje | Trabajo paralelo | Definition of Done mínima / criterio de cierre | Sprint Review: evidencia a demostrar |
| :---: | :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | E1 | Definir el producto y organizar el desarrollo | Actores Cliente/Admin; alcance; Product Backlog; HU o casos de uso; criterios de aceptación; ERS inicial; repositorio Git; estimación inicial con SP. | Scrum, Git/GitHub, análisis de requerimientos | Definición preliminar de entidades, roles y funcionalidades futuras. | Backlog priorizado; criterios de aceptación verificables; repositorio operativo; trabajo distribuido y visible en Git. | Presentar problema, alcance, backlog, criterios de aceptación, estimaciones relativas, organización del equipo y commits iniciales. |
| **2** | E1 | Construir la estructura navegable de la tienda | Home; catálogo; detalle de producto; formularios; navegación; imágenes/multimedia; footer; estructura inicial cliente/admin. | HTML5 semántico | Refinamiento del Product Backlog y de criterios de aceptación. | Navegación funcional y estructura semántica coherente con los requerimientos. | Recorrer el sitio; justificar etiquetas semánticas; mostrar navegación, formularios, recursos y commits del sprint. |
| **3** | E1 | Diseñar la interfaz de cliente y administración | Diseño visual; catálogo; formularios; vistas cliente/admin; adaptación móvil/escritorio. | CSS externo + Bootstrap | Refinamiento de interfaz y backlog. | CSS personalizado externo; Bootstrap integrado; interfaz usable y responsive. | Mostrar escritorio/móvil; distinguir Bootstrap de CSS propio; justificar decisiones visuales y evidenciar trabajo en Git. |
| **4** | E1 | Incorporar validaciones y cerrar el sitio base | Formularios; validaciones; mensajes de error/sugerencias; comportamiento JavaScript requerido por EP1. El carrito JS NO es entregable del proyecto. | JavaScript para validaciones y comportamiento requerido | Diseño funcional del carrito que posteriormente se implementará en TypeScript. | Casos válidos e inválidos operativos; mensajes claros; trazabilidad con criterios de aceptación; historial Git acumulado. | Demostrar validaciones positivas/negativas, criterio de aceptación asociado, código JS y participación sostenida del equipo. |
| **5** | E2 | Transformar la solución en una SPA React tipada | Proyecto React; estructura pages/components/models/services; modelos TypeScript; layout; primeras vistas migradas. | React + TypeScript + SWC + Bootstrap | Preparación del proyecto Spring Boot. | SPA ejecutable; TypeScript usado realmente; estructura coherente; primera migración funcional. | Mostrar SPA; explicar estructura; demostrar interfaces/types y diferencia entre sitio tradicional y SPA. |
| **6** | E2 | Construir una interfaz componentizada y reutilizable | ProductCard, ProductList, Navbar, componentes de administración; props tipadas; composición y reutilización. | React + TypeScript: componentes, props e interfaces | Spring Boot: conexión BD, entidades y modelo. | Componentes reutilizables; props tipadas; Bootstrap responsive; separación página/componente. | Demostrar reutilización, props, interfaces/types, composición, responsive y avance paralelo del modelo backend. |
| **7** | E2 | Implementar la lógica propia del carrito en TypeScript | Carrito creado por los estudiantes en TS: agregar, eliminar, modificar cantidad, subtotal, total, vaciar e inicio de checkout. | TypeScript + React: useState, eventos, formularios y lógica tipada | Spring Boot: Repository, Service y lógica de negocio. | Carrito funcional escrito en TypeScript; modelos Producto/ItemCarrito tipados; operaciones coherentes con criterios de aceptación. | Demostrar carrito completo, cambios de estado, funciones TS, modelos tipados y criterios de aceptación satisfechos. |
| **8** | E2 | Consolidar la tienda como SPA cliente/admin | Router; Home; catálogo; detalle; carrito; checkout; login; administración; parámetros de ruta; 404. | React Router + TypeScript + Bootstrap | Spring Boot: Controllers y endpoints REST iniciales. | Navegación SPA sin reload; rutas y parámetros; cliente/admin integrados; carrito TS integrado; responsive global. | Recorrer la SPA completa; demostrar rutas, parámetros, componentes, estado, carrito TS y diseño responsive. |
| **9** | E2 | Verificar los comportamientos críticos del frontend | Primer conjunto de pruebas derivadas de HU y criterios de aceptación: carrito, formularios y componentes. | Vitest + React Testing Library | Spring Boot: completar CRUD. | Pruebas ejecutables y trazables a criterios de aceptación; casos positivos y negativos. | Ejecutar tests; explicar CA -> test; mostrar casos exitosos y un fallo controlado. |
| **10** | E2 | Consolidar el proceso de testing | 10 pruebas relevantes; mocks; coverage; análisis de resultados; documento de cobertura. | Vitest + RTL + mocks + coverage | Spring Boot: CRUD completo, Swagger y API estable. | 10 pruebas significativas ejecutables; mocks cuando corresponda; cobertura disponible y analizada. | Ejecutar suite completa; demostrar 10 tests, mocks, coverage y explicar alcance y resultados. |
| **11** | E3 | Integrar la SPA con el backend real | Sustituir datos locales/mocks; catálogo real; CRUD admin; pedidos/checkout; endpoints; Swagger. | Axios + REST + Spring Boot + Base de Datos | Implementación de Spring Security y JWT. | Flujos GET/POST/PUT/DELETE integrados; Swagger disponible; frontend consume API real mediante Axios. | Demostrar React -> Axios -> REST -> Spring -> BD -> respuesta; CRUD completo; Swagger; lógica y modelo backend. |
| **12** | E3 | Proteger y cerrar la solución Full Stack | Login; JWT; roles CLIENTE/ADMIN; persistencia de sesión; rutas/acciones restringidas; pago simulado; cierre funcional. | Spring Boot + Spring Security + JWT + React + Axios | Integración final y estabilización. | Autenticación y autorización operativas; sesión persiste tras recarga; frontend y backend restringen según rol. | Demostrar login, token, persistencia de sesión, acceso Cliente/Admin, rechazo de accesos indebidos y solución final integrada. |
