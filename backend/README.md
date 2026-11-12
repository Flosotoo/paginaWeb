# Ecosistema Backend · EduSaldo (Spring Boot + MySQL)

El backend de **EduSaldo** está diseñado bajo una arquitectura de **microservicios desacoplados** en topología de estrella (*Hub & Spoke*) orquestados por un **API Gateway** central. Cada microservicio gestiona su propio contexto delimitado (*Bounded Context*) bajo principios de **Domain-Driven Design (DDD)** y su propia base de datos relacional independiente en **MySQL**.

---

## 🏛️ Topología de Servicios y Puertos

| Componente | Carpeta | Puerto | Base de Datos | Swagger UI Local |
| :--- | :--- | :---: | :--- | :--- |
| **API Gateway Central** | [`edusaldo-api-gateway/`](edusaldo-api-gateway/) | **8090** | N/A (enrutamiento perimetral y CORS) | `http://localhost:8090` |
| **MS Auth y Usuarios** | [`edusaldo-ms-auth-usuarios/`](edusaldo-ms-auth-usuarios/) | **8091** | `db_usuarios` | Puerto interno protegido |
| **MS Alumnos y Saldos** | [`edusaldo-ms-alumnos-saldos/`](edusaldo-ms-alumnos-saldos/) | **8092** | `db_saldos` | Puerto interno protegido |
| **MS Productos e Inventario** | [`edusaldo-ms-productos-inventario/`](edusaldo-ms-productos-inventario/) | **8093** | `db_inventario` | Puerto interno protegido |
| **MS Reservas y Entregas** | [`edusaldo-ms-ventas-reservas/`](edusaldo-ms-ventas-reservas/) | **8094** | `db_reservas` | Puerto interno protegido |

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

## 🌐 Uso del API

El navegador y los clientes externos consumen `http://localhost:8090`. Los puertos de los microservicios requieren una clave interna compartida entre procesos; esa clave no se entrega al frontend. Para probar los flujos, utiliza la colección Postman o la suite HTTP.

Las rutas principales son:

- `POST /api/auth/login` inicia una sesión; las solicitudes autorizadas usan `Authorization: Bearer <token>`.
- `GET /api/auth/sesion` consulta la sesión vigente; `POST /api/auth/cerrar-sesion` la revoca.
- `GET /api/productos` consulta el catálogo y `GET /api/saldos/cuenta/{alumnoId}` consulta la cuenta autorizada.
- `POST /api/saldos/abonos/iniciar` y `POST /api/saldos/abonos/confirmar` ejecutan un pago simulado en dos pasos.
- `POST /api/reservas`, `POST /api/reservas/{id}/marcar-lista` y `POST /api/reservas/{id}/entregar` gestionan el ciclo de una reserva. `POST /api/reservas/{id}/cancelar` exige permisos y estado compatibles.
- `POST /api/entregas/meson` registra una entrega presencial y `POST /api/devoluciones` registra una devolución sobre una entrega existente.
- `POST /api/inventario/ajustes/solicitar` registra una solicitud; `POST /api/inventario/ajustes/{id}/aprobar` o `/rechazar` la resuelve por un administrador.

Los servicios publican OpenAPI en sus puertos internos, protegidos por la misma clave que el resto de sus rutas; no son páginas públicas accesibles directamente desde el navegador.

---

## 📮 Colección Postman

Importa [`scripts/pruebas_postman_coleccion.json`](../scripts/pruebas_postman_coleccion.json) en Postman (*File -> Import*). La colección utiliza el gateway y crea datos de prueba durante sus flujos.

---

## 🧪 Pruebas Unitarias de Microservicios

Para ejecutar las baterías de pruebas unitarias con base de datos en memoria (H2) de cada microservicio:
```bash
cd backend/edusaldo-ms-auth-usuarios && mvn clean test
cd ../edusaldo-ms-alumnos-saldos && mvn clean test
cd ../edusaldo-ms-productos-inventario && mvn clean test
cd ../edusaldo-ms-ventas-reservas && mvn clean test
```
