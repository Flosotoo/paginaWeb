# EduSaldo - Plataforma de Librería Escolar y Gestión de Saldos

Proyecto semestral para la asignatura **Desarrollo Fullstack II (DSY1104)**.

### Equipo de Desarrollo
- **Pamela Acuña**
- **Antonio Jara**
- **Florencia Soto**

---

**EduSaldo** es una plataforma para controlar operaciones de librerías escolares. Los apoderados pueden recargar saldos mediante una pasarela simulada; los alumnos pueden retirar materiales presencialmente y, desde los 12 años, reservar por sí mismos. El personal gestiona entregas e inventario.

La plataforma está construida bajo una **arquitectura de microservicios en Spring Boot**, un **API Gateway central**, un frontend en **React 18 con TypeScript y Vite** y persistencia relacional con **MySQL**.

---

## 📁 Estructura del Monorepo

```text
EduSaldo/
├── iniciar_proyecto.bat                   <- [Windows] Doble clic para arrancar todo automáticamente
├── iniciar_proyecto.sh                    <- [Linux/macOS] Script de arranque rápido
├── scripts/                               <- Herramientas operativas centralizadas (Multiplataforma)
│   ├── arrancar_todo.py                   <- Orquestador unificado (BD + Backend + Frontend en navegador)
│   ├── 1_reset_bases_datos.py             <- Borrado y recreación limpia de las 4 BDs con seeds
│   ├── 2_arrancar_servicios.py            <- Arranque concurrente de los 5 servicios (auto-compila y --stop)
│   ├── 3_arrancar_frontend.py             <- Servidor de desarrollo Vite en http://localhost:5173
│   ├── 4_pruebas_http_automaticas.py      <- Pruebas HTTP de integración, borde y seguridad
│   └── pruebas_postman_coleccion.json     <- Colección Postman preconfigurada
│
├── backend/                               <- Ecosistema Backend en Spring Boot (Ver backend/README.md)
│   ├── edusaldo-api-gateway/              <- Puerto 8090 · Spring Cloud Gateway (Punto de entrada)
│   ├── edusaldo-ms-auth-usuarios/         <- Puerto 8091 · Identidad, sesiones y usuarios (db_usuarios)
│   ├── edusaldo-ms-alumnos-saldos/        <- Puerto 8092 · Cuentas de saldo y abonos (db_saldos)
│   ├── edusaldo-ms-productos-inventario/  <- Puerto 8093 · Catálogo y control de stock (db_inventario)
│   └── edusaldo-ms-ventas-reservas/       <- Puerto 8094 · Reservas, entregas y devoluciones (db_reservas)
│
├── frontend/                              <- SPA Web en React + TypeScript (Ver frontend/README.md)
│   ├── src/                               <- Componentes, páginas por rol, contexto y rutas
│   ├── package.json                       <- Dependencias y scripts npm
│   └── vite.config.ts                     <- Configuración de Vite
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
| **MS Auth y Usuarios** | [`backend/edusaldo-ms-auth-usuarios/`](backend/edusaldo-ms-auth-usuarios/) | **8091** | `db_usuarios` | Puerto interno protegido |
| **MS Alumnos y Saldos** | [`backend/edusaldo-ms-alumnos-saldos/`](backend/edusaldo-ms-alumnos-saldos/) | **8092** | `db_saldos` | Puerto interno protegido |
| **MS Productos e Inventario** | [`backend/edusaldo-ms-productos-inventario/`](backend/edusaldo-ms-productos-inventario/) | **8093** | `db_inventario` | Puerto interno protegido |
| **MS Reservas y Entregas** | [`backend/edusaldo-ms-ventas-reservas/`](backend/edusaldo-ms-ventas-reservas/) | **8094** | `db_reservas` | Puerto interno protegido |

---

## 🚀 Guía de Puesta en Marcha (Paso a Paso y Alternativas)

### Prerrequisitos Básicos
- **MySQL 8.0** o **MariaDB / XAMPP** con el servicio MySQL activo en el puerto `3306`.
- **Java 17 o superior** (Java 17, 21, etc.).
- **Node.js 18+ o 22+** y **npm**.
- **Python 3.10+** (para ejecución automatizada).
- **Apache Maven 3.8+** (necesario si se compila el backend desde código fuente).

---

### Método 1: Lanzador Todo en Uno (Recomendado para la Presentación)

Este método realiza automáticamente la configuración de base de datos con seeds, compila los JARs de Spring Boot si no existen, levanta los 5 microservicios en segundo plano, arranca el frontend e inicia el navegador en `http://localhost:5173`:

- **En Windows:**  
  Haz doble clic en el archivo **`iniciar_proyecto.bat`** (o ejecuta en CMD/PowerShell: `python scripts\arrancar_todo.py`).
- **En Linux / macOS:**  
  Ejecuta en terminal:  
  ```bash
  ./iniciar_proyecto.sh
  # o directamente:
  python3 scripts/arrancar_todo.py
  ```

> [!TIP]
> **Detención Rápida**: Para detener todos los procesos del proyecto y liberar los puertos `8090..8094`, simplemente presiona `Ctrl+C` en la terminal o ejecuta:
> ```bash
> python scripts/arrancar_todo.py --stop
> ```

---

### Método 2: Ejecución Modular Paso a Paso con Scripts

Si prefieres controlar cada etapa manualmente o ejecutar en terminales separadas:

#### Paso 1: Reconstrucción Limpia de Base de Datos y Carga de Seeds
Recrea los 4 esquemas limpios (`db_usuarios`, `db_saldos`, `db_inventario`, `db_reservas`) con sus tablas, llaves foráneas y datos iniciales de prueba:
```bash
python scripts/1_reset_bases_datos.py
```

#### Paso 2: Compilación y Arranque del Backend (Gateway + 4 Microservicios)
Si es la primera vez que se ejecuta en el equipo o no existen los archivos JAR en las carpetas `target/`, el script compilará automáticamente con Maven antes de iniciar:
```bash
python scripts/2_arrancar_servicios.py
```
> [!NOTE]
> - Para forzar una recompilación limpia con Maven: `python scripts/2_arrancar_servicios.py --build`
> - Para arrancar los servicios en segundo plano y liberar la consola: `python scripts/2_arrancar_servicios.py --detached`
> - Para detener los servicios en cualquier momento: `python scripts/2_arrancar_servicios.py --stop`

#### Paso 3: Arranque del Frontend Web (React + Vite)
En una nueva terminal, inicia el servidor de desarrollo web (instalará dependencias automáticamente si falta `node_modules`):
```bash
python scripts/3_arrancar_frontend.py
```
Abre en el navegador: **`http://localhost:5173`**

---

### Método 3: Procedimiento 100% Manual de Respaldo (Sin Scripts Python)

Si por restricciones del equipo en DUOC no se pueden ejecutar scripts en Python, sigue este procedimiento manual:

#### 1. Ubicación de los Archivos SQL de Seeds y Creación Manual en phpMyAdmin
Cada microservicio contiene su archivo `schema.sql` canónico con la creación de tablas, llaves foráneas y los datos iniciales de prueba (seeds). Las ubicaciones exactas dentro del proyecto son:

| Microservicio | Base de Datos | Ubicación Exacta del Archivo SQL (Seeds) |
| :--- | :--- | :--- |
| **Auth y Usuarios** | `db_usuarios` | [`backend/edusaldo-ms-auth-usuarios/src/main/resources/schema.sql`](backend/edusaldo-ms-auth-usuarios/src/main/resources/schema.sql) |
| **Alumnos y Saldos** | `db_saldos` | [`backend/edusaldo-ms-alumnos-saldos/src/main/resources/schema.sql`](backend/edusaldo-ms-alumnos-saldos/src/main/resources/schema.sql) |
| **Productos e Inventario** | `db_inventario` | [`backend/edusaldo-ms-productos-inventario/src/main/resources/schema.sql`](backend/edusaldo-ms-productos-inventario/src/main/resources/schema.sql) |
| **Ventas y Reservas** | `db_reservas` | [`backend/edusaldo-ms-ventas-reservas/src/main/resources/schema.sql`](backend/edusaldo-ms-ventas-reservas/src/main/resources/schema.sql) |

**Pasos para poblar manualmente en phpMyAdmin (`http://localhost/phpmyadmin`):**
1. En la pestaña **SQL** de phpMyAdmin, ejecuta la creación de los 4 esquemas:
   ```sql
   DROP DATABASE IF EXISTS `db_usuarios`; CREATE DATABASE `db_usuarios` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   DROP DATABASE IF EXISTS `db_saldos`; CREATE DATABASE `db_saldos` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   DROP DATABASE IF EXISTS `db_inventario`; CREATE DATABASE `db_inventario` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   DROP DATABASE IF EXISTS `db_reservas`; CREATE DATABASE `db_reservas` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Selecciona la base de datos `db_usuarios` en el menú izquierdo, ve a la pestaña **Importar**, selecciona el archivo `backend/edusaldo-ms-auth-usuarios/src/main/resources/schema.sql` y presiona **Continuar**.
3. Repite el proceso para `db_saldos`, `db_inventario` y `db_reservas` seleccionando su respectivo archivo `schema.sql`.

#### 2. Compilación y Arranque Manual del Backend
Compila los 5 módulos con Maven (ejecuta en la raíz del repositorio o dentro de cada carpeta):
```bash
mvn -f backend/edusaldo-api-gateway/pom.xml clean package -DskipTests
mvn -f backend/edusaldo-ms-auth-usuarios/pom.xml clean package -DskipTests
mvn -f backend/edusaldo-ms-alumnos-saldos/pom.xml clean package -DskipTests
mvn -f backend/edusaldo-ms-productos-inventario/pom.xml clean package -DskipTests
mvn -f backend/edusaldo-ms-ventas-reservas/pom.xml clean package -DskipTests
```
Una vez compilados, puedes arrancar cada microservicio en una terminal distinta con Java:
```bash
# Terminal 1: Auth y Usuarios (8091)
java -jar backend/edusaldo-ms-auth-usuarios/target/ms-auth-usuarios-2.0.0.jar

# Terminal 2: Alumnos y Saldos (8092)
java -jar backend/edusaldo-ms-alumnos-saldos/target/ms-alumnos-saldos-2.0.0.jar

# Terminal 3: Productos e Inventario (8093)
java -jar backend/edusaldo-ms-productos-inventario/target/ms-productos-inventario-2.0.0.jar

# Terminal 4: Ventas y Reservas (8094)
java -jar backend/edusaldo-ms-ventas-reservas/target/ms-ventas-reservas-2.0.0.jar

# Terminal 5: API Gateway (8090)
java -jar backend/edusaldo-api-gateway/target/api-gateway-2.0.0.jar
```

#### 3. Arranque Manual del Frontend
En una terminal en la carpeta `frontend/`:
```bash
cd frontend
npm install
npm run dev
```
Abre tu navegador en: **`http://localhost:5173`**

---

## 🧪 Pruebas del Sistema

Toda la operativa de pruebas está centralizada en [`scripts/`](scripts/):
- **Batería unificada de integración, casos de borde y seguridad:**
  ```bash
  python scripts/4_pruebas_http_automaticas.py
  ```
  Primero se ejecutan los flujos de integración, luego los casos de borde y finalmente controles adicionales de negocio y seguridad. Las pruebas requieren las bases con datos semilla y modifican sus registros. Los intentos de acceso no autorizado se consideran fallos si la API los permite.
- **Colección Postman:** Importa [`scripts/pruebas_postman_coleccion.json`](scripts/pruebas_postman_coleccion.json) directamente en Postman.
- **Contratos del backend:** Consulta [`backend/README.md`](backend/README.md) para conocer las rutas y la protección de los puertos internos.

---

## 📚 Documentación Detallada por Módulo

Para profundizar en cada componente, consulta los READMEs especializados:

1. 🏛️ **[Documentación de Arquitectura y Requerimientos (`docs/README.md`)](docs/README.md):**
   - Matriz de 56 Historias de Usuario (HU01 a HU56).
   - Diagramas Mermaid de arquitectura en estrella, clases por microservicio y flujos de secuencia.
   - Comunicaciones síncronas (`S01` a `S11`) y notificaciones simuladas (`A01` a `A03`).
2. ⚙️ **[Ecosistema de Microservicios Backend (`backend/README.md`)](backend/README.md):**
   - Reglas de dominio (aislamiento multi-tenant, moneda entera CLP, integridad referencial).
   - Guía de endpoints REST y consolas Swagger individuales.
   - Ejecución de pruebas unitarias con base de datos H2 en memoria (`mvn test`).
3. 💻 **[Frontend SPA React + TypeScript (`frontend/README.md`)](frontend/README.md):**
   - Arquitectura componentizada, enrutamiento por roles (`Admin`, `Encargado`, `Apoderado`, `Alumno`).
   - Gestión de estado global con Context API.
   - Suite de testing de componentes con Vitest y React Testing Library.
