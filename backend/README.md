# Ecosistema Backend · EduSaldo (Spring Boot + MySQL)

El backend de **EduSaldo** está diseñado bajo una arquitectura de **microservicios desacoplados** en topología de estrella (*Hub & Spoke*) orquestados por un **API Gateway** central. Cada microservicio gestiona su propio contexto delimitado (*Bounded Context*) bajo principios de **Domain-Driven Design (DDD)** y su propia base de datos relacional independiente en **MySQL**.

---

## 🏛️ Topología de Servicios y Puertos

| Componente | Carpeta | Puerto | Base de Datos | Swagger UI Local |
| :--- | :--- | :---: | :--- | :--- |
| **API Gateway Central** | [`edusaldo-api-gateway/`](edusaldo-api-gateway/) | **8090** | N/A (enrutamiento perimetral, JWT y CORS) | `http://localhost:8090` |
| **MS Auth y Usuarios** | [`edusaldo-ms-auth-usuarios/`](edusaldo-ms-auth-usuarios/) | **8091** | `db_usuarios` | `http://localhost:8091/swagger-ui.html` (enruta vía 8090) |
| **MS Alumnos y Saldos** | [`edusaldo-ms-alumnos-saldos/`](edusaldo-ms-alumnos-saldos/) | **8092** | `db_saldos` | `http://localhost:8092/swagger-ui.html` (enruta vía 8090) |
| **MS Productos e Inventario** | [`edusaldo-ms-productos-inventario/`](edusaldo-ms-productos-inventario/) | **8093** | `db_inventario` | `http://localhost:8093/swagger-ui.html` (enruta vía 8090) |
| **MS Reservas y Entregas** | [`edusaldo-ms-ventas-reservas/`](edusaldo-ms-ventas-reservas/) | **8094** | `db_reservas` | `http://localhost:8094/swagger-ui.html` (enruta vía 8090) |

---

## 📐 Reglas de Dominio e Invariantes Arquitectónicas

1. **Aislamiento Multi-Tenant Lógico:**
   - La plataforma es multiestablecimiento. Todas las entidades raíz y consultas filtran por `idEstablecimiento : Long` (por defecto `1L`).
2. **Integridad Referencial Intra-Servicio vs Inter-Servicio:**
   - **Intra-servicio (Misma BD):** Todas las tablas del mismo esquema están vinculadas mediante `CONSTRAINT fk_... FOREIGN KEY` reales en MySQL (`ENGINE=InnoDB`) y relaciones JPA con `@JsonIgnore` para prevenir ciclos de serialización.
   - **Inter-servicio (Distinta BD):** No existen llaves foráneas entre bases de datos distintas. Las referencias a IDs externos (`alumnoId`, `productoId`, etc.) se almacenan como `Long` y se validan mediante las 11 operaciones síncronas REST oficiales (`S01` a `S11`).
3. **Moneda y Cantidades:**
   - Montos financieros, precios y saldos operan estrictamente en enteros en pesos chilenos (`int` CLP, sin decimales).
   - Cantidades de stock físico, reservado y crítico operan como enteros (`int`).
4. **Invariantes Clave:**
   - **Invariante de Saldo:** `saldoDisponible = saldoActual - saldoComprometido >= 0`.
   - **Invariante de Stock:** `stockDisponible = stockFisico - stockReservado >= 0`.

---

## 🛠️ Herramientas Operativas y Scripts (Carpeta `scripts/`)

Todas las operaciones de base de datos, arranque y pruebas se controlan desde la carpeta centralizada [`scripts/`](../scripts/) en la raíz del repositorio:

### 1. Reinicio Limpio de Bases de Datos (Fresh Start)
Recrea los 4 esquemas canónicos y carga los seeds iniciales:
```bash
python scripts/1_reset_bases_datos.py
```

### 2. Arranque Concurrente del Backend
Levanta concurrentemente el API Gateway y los 4 microservicios con monitoreo de logs en vivo (compila automáticamente con Maven si faltan los JARs):
```bash
python scripts/2_arrancar_servicios.py
```
> [!TIP]
> - Para forzar una recompilación limpia de los 5 módulos: `python scripts/2_arrancar_servicios.py --build`
> - Para arrancar en segundo plano y liberar la terminal: `python scripts/2_arrancar_servicios.py --detached`
> - Para detener los servicios y liberar los puertos `8090..8094` en cualquier momento: `python scripts/2_arrancar_servicios.py --stop`

### 3. Batería de Pruebas Automatizadas E2E y Casos de Borde
Ejecuta casos de integración, controles de borde y pruebas adicionales de negocio y seguridad contra el Gateway (`http://localhost:8090`). Requiere los datos semilla y modifica registros:
```bash
python scripts/4_pruebas_http_automaticas.py
```

---

## 🌐 Uso del API y Seguridad JWT

El navegador y los clientes externos consumen `http://localhost:8090`. La autenticación opera mediante **JWT firmado con HS256** (`iss=edusaldo-auth`, expiración de 1 hora): `edusaldo-ms-auth-usuarios` firma el token y persiste el hash SHA-256 de su `jti` en `sesiones_usuario` para permitir revocación inmediata al cerrar sesión o bloquear la cuenta. El API Gateway verifica criptográficamente el JWT en el borde (rechazando con `401` tokens expirados, adulterados o `alg: none`), comprueba la vigencia/revocación y aplica autorización por rol y establecimiento antes de enrutar.

Los puertos de los microservicios requieren la clave interna `EDUSALDO_INTERNAL_KEY` y el firmado/verificación JWT requiere `EDUSALDO_JWT_SECRET` (ambas de al menos 32 bytes; `scripts/2_arrancar_servicios.py` las genera e inyecta automáticamente y ninguna se entrega al frontend). Para probar los flujos, utiliza la colección Postman o la suite HTTP.

Las rutas principales son:

- `POST /api/auth/login` inicia una sesión y retorna un JWT HS256; las solicitudes autorizadas usan `Authorization: Bearer <token>`.
- `GET /api/auth/sesion` consulta la sesión vigente; `POST /api/auth/cerrar-sesion` la revoca.
- `GET /api/productos` consulta el catálogo y `GET /api/saldos/cuenta/{alumnoId}` consulta la cuenta autorizada.
- `POST /api/saldos/abonos/iniciar` y `POST /api/saldos/abonos/confirmar` ejecutan un pago simulado en dos pasos.
- `POST /api/reservas`, `POST /api/reservas/{id}/marcar-lista` y `POST /api/reservas/{id}/entregar` gestionan el ciclo de una reserva. `POST /api/reservas/{id}/cancelar` exige permisos y estado compatibles.
- `POST /api/entregas/meson` registra una entrega presencial y `POST /api/devoluciones` registra una devolución sobre una entrega existente.
- `POST /api/inventario/ajustes/solicitar` registra una solicitud; `POST /api/inventario/ajustes/{id}/aprobar` o `/rechazar` la resuelve por un administrador.

- `GET /api/proveedores`, `POST /api/proveedores`, `PUT /api/proveedores/{id}` y `PATCH /api/proveedores/{id}/activar|desactivar` administran el maestro de proveedores con validación RUT Módulo 11.
- `POST /api/ordenes-compra`, `PATCH /api/ordenes-compra/{id}/aprobar` y `PATCH /api/ordenes-compra/{id}/recepcionar` ejecutan el ciclo de órdenes de compra e ingreso idempotente a inventario con valorización por costo promedio ponderado.
- `GET /api/inventario/valorizacion` y `GET /api/inventario/costos-ventas` exponen la valorización de existencias y el costo histórico de entregas/devoluciones exclusivamente para `ADMINISTRADOR`.

En desarrollo local (`edusaldo.swagger.public=true`), los cuatro microservicios exponen su interfaz de documentación en `/swagger-ui.html` y `/api-docs` configurada con `OpenApiConfig` apuntando a `http://localhost:8090` y esquema `bearerAuth` (JWT), mientras mantienen bloqueado con `401` cualquier acceso directo a `/api/**` sin `X-Internal-Key`. En el perfil `prod` (`application-prod.yml`), Swagger queda deshabilitado y los secretos deben suministrarse obligatoriamente por variables de entorno.

---

## 📮 Colección Postman

Importa [`scripts/pruebas_postman_coleccion.json`](../scripts/pruebas_postman_coleccion.json) en Postman (*File -> Import*). La colección utiliza el gateway y crea datos de prueba durante sus flujos.

---

## 🧪 Pruebas Unitarias de Microservicios

Para ejecutar las baterías de pruebas unitarias del gateway y de cada microservicio (con H2 en memoria):
```bash
cd backend/edusaldo-api-gateway && mvn clean test
cd ../edusaldo-ms-auth-usuarios && mvn clean test
cd ../edusaldo-ms-alumnos-saldos && mvn clean test
cd ../edusaldo-ms-productos-inventario && mvn clean test
cd ../edusaldo-ms-ventas-reservas && mvn clean test
```
