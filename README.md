# EduSaldo - Plataforma de Librería Escolar y Gestión de Saldos

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

### Equipo de Desarrollo
- **Pamela Acuña**
- **Antonio Jara**
- **Florencia Soto**

---

**EduSaldo** es una solución integral diseñada para digitalizar y controlar las operaciones de librerías escolares bajo la administración del Centro General de Padres y Apoderados. Permite a los apoderados recargar saldos prepagados vía Webpay simulado o transferencia bancaria, a los alumnos retirar o reservar útiles escolares de forma presencial o autónoma, y al personal de librería despachar entregas y controlar inventarios con trazabilidad estricta.

La plataforma está construida bajo una **arquitectura de microservicios en Spring Boot**, un **API Gateway central**, un frontend en **React 18 con TypeScript y Vite** y persistencia relacional con **MySQL**.

---

## 📁 Estructura del Monorepo

```text
EduSaldo/
├── scripts/                               <- Herramientas operativas centralizadas (Multiplataforma)
│   ├── 1_reset_bases_datos.py             <- Borrado y recreación limpia de las 4 BDs con seeds
│   ├── 2_arrancar_servicios.py            <- Arranque concurrente de los 5 servicios (con --stop)
│   ├── 3_arrancar_frontend.py             <- Servidor de desarrollo Vite en http://localhost:5173
│   ├── 4_pruebas_http_automaticas.py      <- Batería E2E de 23 pruebas de integración en vivo
│   └── pruebas_postman_coleccion.json     <- Colección Postman preconfigurada
│
├── backend/                               <- Ecosistema Backend en Spring Boot (Ver backend/README.md)
│   ├── edusaldo-api-gateway/              <- Puerto 8090 · Spring Cloud Gateway (Punto de entrada)
│   ├── edusaldo-ms-auth-usuarios/         <- Puerto 8091 · Identidad, JWT y usuarios (db_usuarios)
│   ├── edusaldo-ms-alumnos-saldos/        <- Puerto 8092 · Cuentas de saldo y abonos (db_saldos)
│   ├── edusaldo-ms-productos-inventario/  <- Puerto 8093 · Catálogo y control de stock (db_inventario)
│   └── edusaldo-ms-ventas-reservas/       <- Puerto 8094 · Reservas, entregas y devoluciones (db_reservas)
│
├── frontend/                              <- SPA Web en React + TypeScript (Ver frontend/README.md)
│   ├── src/                               <- Componentes, páginas por rol, contexto y rutas
│   ├── package.json                       <- Dependencias y scripts npm
│   └── vite.config.ts                     <- Configuración de Vite y proxy
│
└── docs/                                  <- Documentación formal del proyecto (Ver docs/README.md)
    ├── EduSaldo - Arquitectura...docx     <- Documento formal de arquitectura
    ├── EduSaldo - Plantilla...xlsx        <- Planilla de 56 Historias de Usuario (HU01 a HU56)
    └── diagramas/                         <- Diagramas Mermaid de arquitectura, clases y flujos
```

---

## 🌐 Puertos y Componentes

| Componente | Carpeta | Puerto | Base de Datos | Swagger UI / URL |
| :--- | :--- | :---: | :--- | :--- |
| **Frontend Web (React)** | [`frontend/`](frontend/) | **5173** | N/A (consume 8090) | `http://localhost:5173` |
| **API Gateway Central** | [`backend/edusaldo-api-gateway/`](backend/edusaldo-api-gateway/) | **8090** | N/A (enrutamiento) | `http://localhost:8090` |
| **MS Auth y Usuarios** | [`backend/edusaldo-ms-auth-usuarios/`](backend/edusaldo-ms-auth-usuarios/) | **8091** | `db_usuarios` | [http://localhost:8091/swagger-ui.html](http://localhost:8091/swagger-ui.html) |
| **MS Alumnos y Saldos** | [`backend/edusaldo-ms-alumnos-saldos/`](backend/edusaldo-ms-alumnos-saldos/) | **8092** | `db_saldos` | [http://localhost:8092/swagger-ui.html](http://localhost:8092/swagger-ui.html) |
| **MS Productos e Inventario** | [`backend/edusaldo-ms-productos-inventario/`](backend/edusaldo-ms-productos-inventario/) | **8093** | `db_inventario` | [http://localhost:8093/swagger-ui.html](http://localhost:8093/swagger-ui.html) |
| **MS Reservas y Entregas** | [`backend/edusaldo-ms-ventas-reservas/`](backend/edusaldo-ms-ventas-reservas/) | **8094** | `db_reservas` | [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html) |

---

## 🚀 Guía Rápida de Puesta en Marcha (Quick Start)

### Prerrequisitos
- **Java 17+** y **Maven 3.8+**
- **Node.js v20+** y **npm v10+**
- **Python 3.10+**
- **MySQL 8.0** o **XAMPP MySQL** corriendo en el puerto 3306

---

### Paso 1: Configurar las Bases de Datos MySQL (Fresh Start)
Recrea los 4 esquemas canónicos limpios con sus tablas y datos iniciales de prueba:
```bash
python scripts/1_reset_bases_datos.py
```

---

### Paso 2: Levantar el Backend (Gateway + 4 Microservicios)
Compila y levanta concurrentemente los 5 servicios Spring Boot con monitor de logs en vivo:
```bash
python scripts/2_arrancar_servicios.py
```
> [!TIP]
> Si deseas detener los servicios y liberar los puertos `8090..8094`:
> ```bash
> python scripts/2_arrancar_servicios.py --stop
> ```

---

### Paso 3: Levantar el Frontend Web
En una nueva terminal, arranca el servidor de desarrollo Vite:
```bash
python scripts/3_arrancar_frontend.py
```
Abre tu navegador en: **`http://localhost:5173`**

---

## 🧪 Pruebas del Sistema

Toda la operativa de pruebas está centralizada en [`scripts/`](scripts/):
- **Batería Automatizada E2E (23 casos):**
  ```bash
  python scripts/4_pruebas_http_automaticas.py
  ```
- **Colección Postman:** Importa [`scripts/pruebas_postman_coleccion.json`](scripts/pruebas_postman_coleccion.json) directamente en Postman.
- **Consolas Swagger UI:** Consulta [`backend/README.md`](backend/README.md#flujos-principales-para-probar-en-swagger) para ver ejemplos de payloads interactivos listos para copiar y pegar.

---

## 📚 Documentación Detallada por Módulo

Para profundizar en cada componente, consulta los READMEs especializados:

1. 🏛️ **[Documentación de Arquitectura y Requerimientos (`docs/README.md`)](docs/README.md):**
   - Matriz de 56 Historias de Usuario (HU01 a HU56).
   - Diagramas Mermaid de arquitectura en estrella, clases por microservicio y flujos de secuencia.
   - Especificación formal de comunicaciones síncronas (`S01` a `S12`) y asíncronas (`A01` a `A03`).
2. ⚙️ **[Ecosistema de Microservicios Backend (`backend/README.md`)](backend/README.md):**
   - Reglas de dominio (aislamiento multi-tenant, moneda entera CLP, integridad referencial).
   - Guía de endpoints REST y consolas Swagger individuales.
   - Ejecución de pruebas unitarias con base de datos H2 en memoria (`mvn test`).
3. 💻 **[Frontend SPA React + TypeScript (`frontend/README.md`)](frontend/README.md):**
   - Arquitectura componentizada, enrutamiento por roles (`Admin`, `Encargado`, `Apoderado`, `Alumno`).
   - Gestión de estado global con Context API.
   - Suite de testing de componentes con Vitest y React Testing Library.
