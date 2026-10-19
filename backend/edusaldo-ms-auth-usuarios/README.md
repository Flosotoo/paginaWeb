# EduSaldo · MS Auth y Usuarios (Puerto 8091)

Microservicio responsable de la identidad, autenticación (JWT) y gestión de usuarios polimórficos de la plataforma **EduSaldo**.

---

## 1. Ficha Técnica

- **Puerto:** `8091`
- **Base de Datos MySQL:** `db_usuarios`
- **Swagger UI:** `http://localhost:8091/swagger-ui.html`

---

## 2. Responsabilidades de Dominio

1. **Autenticación y Sesión:**
   - Emisión y validación de tokens JWT.
   - Flujo de primer acceso (`PRIMER_ACCESO`) y cambio obligatorio de clave inicial.
   - Bloqueo dinámico tras intentos fallidos según política de acceso.
2. **Usuarios Polimórficos:**
   - Roles: `ADMINISTRADOR`, `ENCARGADO`, `APODERADO` y `ALUMNO` (alumnos $\ge$ 12 años con login propio).
   - Datos personales atómicos: primer nombre, segundo nombre opcional, primer apellido, segundo apellido opcional.
3. **Parámetros Institucionales y Auditoría:**
   - Parámetros globales del colegio (`Colegio_Concepcion`).
   - Bitácora inmutable de eventos críticos en `RegistroAuditoria`.

---

## 3. Endpoints Clave y Operaciones REST

- `POST /api/auth/login`: Autenticación y generación de token JWT.
- `GET /api/usuarios/buscar-por-rut/{rut}`: Búsqueda atómica de usuarios.
- `POST /api/usuarios`: Alta de usuarios polimórficos.
- `S01`: Validación de alumno y vínculo con apoderado (consumido por MS Reservas).
- `S11` y `S12`: Validación de apoderados y autorizaciones (consumido por MS Saldos).

---

## 4. Ejecución Local

### Prerrequisitos:
- Java 17 o superior
- Base de datos MySQL con esquema `db_usuarios` creado.

### Comandos:
```bash
# Compilar y ejecutar pruebas
mvn clean test

# Levantar el microservicio
mvn spring-boot:run
```
