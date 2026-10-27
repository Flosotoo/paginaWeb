# Ecosistema Backend · EduSaldo (Spring Boot + MySQL)

El backend de **EduSaldo** está diseñado bajo una arquitectura de **microservicios desacoplados** en topología de estrella (*Hub & Spoke*) orquestados por un **API Gateway** central. Cada microservicio gestiona su propio contexto delimitado (*Bounded Context*) bajo principios de **Domain-Driven Design (DDD)** y su propia base de datos relacional independiente en **MySQL**.

---

## 🏛️ Topología de Servicios y Puertos

| Componente | Carpeta | Puerto | Base de Datos | Swagger UI Local |
| :--- | :--- | :---: | :--- | :--- |
| **API Gateway Central** | [`edusaldo-api-gateway/`](edusaldo-api-gateway/) | **8090** | N/A (enrutamiento perimetral y CORS) | `http://localhost:8090` |
| **MS Auth y Usuarios** | [`edusaldo-ms-auth-usuarios/`](edusaldo-ms-auth-usuarios/) | **8091** | `db_usuarios` | [http://localhost:8091/swagger-ui.html](http://localhost:8091/swagger-ui.html) |
| **MS Alumnos y Saldos** | [`edusaldo-ms-alumnos-saldos/`](edusaldo-ms-alumnos-saldos/) | **8092** | `db_saldos` | [http://localhost:8092/swagger-ui.html](http://localhost:8092/swagger-ui.html) |
| **MS Productos e Inventario** | [`edusaldo-ms-productos-inventario/`](edusaldo-ms-productos-inventario/) | **8093** | `db_inventario` | [http://localhost:8093/swagger-ui.html](http://localhost:8093/swagger-ui.html) |
| **MS Reservas y Entregas** | [`edusaldo-ms-ventas-reservas/`](edusaldo-ms-ventas-reservas/) | **8094** | `db_reservas` | [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html) |

---

## 📐 Reglas de Dominio e Invariantes Arquitectónicas

1. **Aislamiento Multi-Tenant Lógico:**
   - La plataforma es multiestablecimiento. Todas las entidades raíz y consultas filtran por `idEstablecimiento : Long` (por defecto `1L`).
2. **Integridad Referencial Intra-Servicio vs Inter-Servicio:**
   - **Intra-servicio (Misma BD):** Todas las tablas del mismo esquema están vinculadas mediante `CONSTRAINT fk_... FOREIGN KEY` reales en MySQL (`ENGINE=InnoDB`) y relaciones JPA con `@JsonIgnore` para prevenir ciclos de serialización.
   - **Inter-servicio (Distinta BD):** No existen llaves foráneas entre bases de datos distintas. Las referencias a IDs externos (`alumnoId`, `productoId`, etc.) se almacenan como `Long` y se validan mediante las 12 operaciones síncronas REST oficiales (`S01` a `S12`).
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
Levanta concurrentemente el API Gateway y los 4 microservicios con monitoreo de logs en vivo:
```bash
python scripts/2_arrancar_servicios.py
```
> [!TIP]
> Para detener los servicios y liberar los puertos `8090..8094` en cualquier momento:
> ```bash
> python scripts/2_arrancar_servicios.py --stop
> ```

### 3. Batería de Pruebas Automatizadas E2E
Ejecuta la suite de 23 casos de prueba de integración contra el Gateway (`http://localhost:8090`):
```bash
python scripts/4_pruebas_http_automaticas.py
```

### 4. Batería de Resiliencia y Casos de Borde (15 Controles)
Evalúa el blindaje contra intentos deliberados de violar invariantes de negocio:
```bash
python scripts/5_pruebas_casos_borde.py
```

---

## 🌐 Pruebas Manuales en Swagger UI

Con los servicios en línea, puedes interactuar directamente con cada microservicio:

- **Auth y Usuarios:** [http://localhost:8091/swagger-ui.html](http://localhost:8091/swagger-ui.html)
- **Alumnos y Saldos:** [http://localhost:8092/swagger-ui.html](http://localhost:8092/swagger-ui.html)
- **Productos e Inventario:** [http://localhost:8093/swagger-ui.html](http://localhost:8093/swagger-ui.html)
- **Reservas y Entregas:** [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html)

### Flujos Principales para Probar en Swagger:

1. **Flujo Feliz (Pedido y Retiro en Librería):**
   - Consultar saldo: `GET /api/saldos/alumno/1` (puerto 8092).
   - Crear reserva: `POST /api/reservas` (puerto 8094).
   - Preparar pedido: `PUT /api/reservas/{id}/preparar` con `preparadaPorId: 2` (puerto 8094).
   - Entrega en mesón: `POST /api/ventas/entrega` (puerto 8094).
   - Verificar débito: `GET /api/saldos/alumno/1` y confirmar descuento.
2. **Rechazo por Saldo Insuficiente:**
   - Intentar `POST /api/reservas` con un monto superior al saldo disponible $\rightarrow$ `400 Bad Request` o `422 Unprocessable Entity` sin afectar existencias.
3. **Rechazo por Quiebre de Stock:**
   - Intentar reservar una cantidad mayor a `stockDisponible` $\rightarrow$ `409 Conflict` sin retener saldo.
4. **Solicitud y Aprobación de Ajuste de Stock:**
   - Encargado solicita: `POST /api/inventario/ajuste` (puerto 8093).
   - Administrador aprueba: `PUT /api/inventario/ajuste/{id}/aprobar` con `administradorId: 1` (puerto 8093).

---

## 📮 Colección Postman

Importa [`scripts/pruebas_postman_coleccion.json`](../scripts/pruebas_postman_coleccion.json) en Postman (*File -> Import*). La colección viene preconfigurada con variables de entorno para apuntar a `http://localhost:8090` o a los puertos individuales.

---

## 🧪 Pruebas Unitarias de Microservicios

Para ejecutar las baterías de pruebas unitarias con base de datos en memoria (H2) de cada microservicio:
```bash
cd backend/edusaldo-ms-auth-usuarios && mvn clean test
cd ../edusaldo-ms-alumnos-saldos && mvn clean test
cd ../edusaldo-ms-productos-inventario && mvn clean test
cd ../edusaldo-ms-ventas-reservas && mvn clean test
```
