# Suite Operativa de Backend · Scripts y Pruebas

Esta carpeta centraliza el herramental operativo para la administración de bases de datos MySQL, el arranque concurrente de los 4 microservicios y del API Gateway, y las baterías de pruebas automatizadas y manuales de **EduSaldo 2.0**.

---

## 🛠️ Herramientas Disponibles

| Script / Archivo | Variante | Propósito |
| :--- | :---: | :--- |
| **`reset_bases_datos.ps1`** | PowerShell | Recrea limpiamente los 4 esquemas MySQL con sus tablas y datos iniciales. |
| **`reset_bases_datos.py`** | Python | Variante multiplataforma para recreación de esquemas MySQL. |
| **`arrancar_servicios.ps1`** | PowerShell | Compila y levanta concurrentemente los 4 microservicios y el API Gateway. |
| **`arrancar_servicios.py`** | Python | Variante multiplataforma de arranque concurrente con transmisión de logs en vivo. |
| **`pruebas_http_automaticas.ps1`** | PowerShell | Batería E2E de 20 casos de prueba reales sobre el Gateway (8090). |
| **`pruebas_http_automaticas.py`** | Python | Variante multiplataforma de la batería E2E de 20 pruebas. |
| **`pruebas_postman_coleccion.json`** | JSON | Colección Postman con todas las peticiones organizadas por microservicio. |

---

## 1. Configuración y Reinicio de Bases de Datos (Fresh Start)

Crea y puebla limpiamente los 4 esquemas canónicos (`db_usuarios`, `db_saldos`, `db_inventario`, `db_reservas`):

```powershell
# En Windows (PowerShell):
.\backend\scripts\reset_bases_datos.ps1

# Multiplataforma (Python):
python backend/scripts/reset_bases_datos.py
```

---

## 2. Arranque Simultáneo de Servicios

Levanta los 4 microservicios backend y el API Gateway en segundo plano, confirmando la disponibilidad de cada puerto antes de finalizar:

```powershell
# En Windows (PowerShell):
.\backend\scripts\arrancar_servicios.ps1

# Multiplataforma (Python):
python backend/scripts/arrancar_servicios.py
```

### Puertos Confirmados:
- **`8090`**: API Gateway Central (Spring Cloud Gateway)
- **`8091`**: MS Auth y Usuarios (`db_usuarios`)
- **`8092`**: MS Alumnos y Saldos (`db_saldos`)
- **`8093`**: MS Productos e Inventario (`db_inventario`)
- **`8094`**: MS Reservas y Entregas (`db_reservas`)

---

## 3. Batería de Pruebas Automatizadas (E2E en Vivo)

Ejecuta 20 casos de uso reales y de borde exclusivamente contra `http://localhost:8090`, validando ciclo de reservas, quiebres de stock, rechazos por saldo insuficiente y flujo de ajuste de inventario:

```powershell
# En Windows (PowerShell):
.\backend\scripts\pruebas_http_automaticas.ps1

# Multiplataforma (Python):
python backend/scripts/pruebas_http_automaticas.py
```

---

## 4. Pruebas Manuales en Swagger UI

Con los servicios levantados, puedes probar los flujos interactivos accediendo a cada consola Swagger:

| Servicio | Swagger UI Local |
| :--- | :--- |
| **01. Auth y Usuarios** | [http://localhost:8091/swagger-ui.html](http://localhost:8091/swagger-ui.html) |
| **02. Alumnos y Saldos** | [http://localhost:8092/swagger-ui.html](http://localhost:8092/swagger-ui.html) |
| **03. Productos e Inventario** | [http://localhost:8093/swagger-ui.html](http://localhost:8093/swagger-ui.html) |
| **04. Ventas y Reservas** | [http://localhost:8094/swagger-ui.html](http://localhost:8094/swagger-ui.html) |

### Flujos Principales para Probar en Swagger:

#### Flujo 1: Ciclo de Pedido y Retiro en Librería (Happy Path)
1. **Consultar saldo del alumno:** `GET /api/saldos/alumno/1` en puerto 8092.
2. **Crear reserva multilínea:** `POST /api/reservas` en puerto 8094.
3. **Preparar pedido (HU31 CA2):** `PUT /api/reservas/{id}/preparar` en puerto 8094 indicando `preparadaPorId : 2` (Encargado).
4. **Entrega de materiales en mesón:** `POST /api/ventas/entrega` en puerto 8094.
5. **Verificar débito:** Consultar `GET /api/saldos/alumno/1` y confirmar descuento y movimiento.

#### Flujo 2: Rechazo por Saldo Insuficiente
- Intentar `POST /api/reservas` con un alumno sin saldo suficiente. El sistema responde `400 Bad Request` indicando la invariante violada y no descuenta existencias.

#### Flujo 3: Rechazo por Quiebre de Stock
- Intentar reservar una cantidad mayor a `stockDisponible`. El sistema responde `409 Conflict` por quiebre de stock sin retener saldo.

#### Flujo 4: Solicitud y Aprobación de Ajuste de Stock
1. **Encargado solicita ajuste:** `POST /api/inventario/ajuste` en puerto 8093 con motivo y cantidad de merma.
2. **Administrador aprueba:** `PUT /api/inventario/ajuste/{id}/aprobar` en puerto 8093 con `administradorId : 1`.
3. **Verificación:** El stock físico se actualiza y se asienta el `MovimientoInventario`.

---

## 5. Colección Postman

Importa [`pruebas_postman_coleccion.json`](pruebas_postman_coleccion.json) directamente en Postman (*File -> Import*). La colección viene preconfigurada con variables de entorno para apuntar a `http://localhost:8090` o directamente a los puertos individuales `8091` a `8094`.
