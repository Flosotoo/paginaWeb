# EduSaldo · API Gateway Central (Puerto 8090)

El **API Gateway** es el punto único de entrada (_Single Point of Entry_) para la plataforma **EduSaldo**. Implementa una **topología en estrella (Hub & Spoke)** sobre Spring Cloud Gateway, centralizando el enrutamiento hacia los 4 microservicios de negocio desacoplados, aplicando políticas globales de CORS para la SPA en React y aislando las bases de datos independientes.

---

## 1. Topología de Red y Enrutamiento

Toda solicitud del cliente o frontend apunta exclusivamente a `http://localhost:8090`. El Gateway redirige de forma transparente al microservicio dueño del dominio:

| Microservicio              |  Puerto  | Rutas Enrutadas por el Gateway              | Swagger UI Local                        |
| :------------------------- | :------: | :------------------------------------------ | :-------------------------------------- |
| **Auth y Usuarios**        | **8091** | `/api/auth/**`<br>`/api/usuarios/**`        | `http://localhost:8091/swagger-ui.html` |
| **Alumnos y Saldos**       | **8092** | `/api/alumnos/**`<br>`/api/saldos/**`       | `http://localhost:8092/swagger-ui.html` |
| **Productos e Inventario** | **8093** | `/api/productos/**`<br>`/api/inventario/**` | `http://localhost:8093/swagger-ui.html` |
| **Ventas y Reservas**      | **8094** | `/api/ventas/**`<br>`/api/reservas/**`      | `http://localhost:8094/swagger-ui.html` |

### Seguridad CORS

El Gateway expone cabeceras `Access-Control-Allow-Origin` para los orígenes de desarrollo (`http://localhost:5173`, `http://localhost:4173`, `http://localhost:3000`), permitiendo métodos `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`.

---

## 2. Operación y Pruebas

Toda la operativa y herramientas están centralizadas en [`scripts/`](../../scripts/):

### Arranque Simultáneo de Servicios:
- **Multiplataforma (Python):** `python scripts/2_arrancar_servicios.py`

### Guías y Baterías de Prueba:
- 📖 **[Manual Operativo de Backend](../README.md):** Guía completa del backend, bases de datos y Swagger UI.
- 🤖 **Pruebas Automatizadas E2E:** `python scripts/4_pruebas_http_automaticas.py`
- 📮 **Colección Postman:** [`scripts/pruebas_postman_coleccion.json`](../../scripts/pruebas_postman_coleccion.json)
