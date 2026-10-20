# EduSaldo · API Gateway Central (Puerto 8090)

El **API Gateway** es el punto único de entrada (*Single Point of Entry*) para la plataforma **EduSaldo**. Implementa una **topología en estrella (Hub & Spoke)** sobre Spring Cloud Gateway, centralizando el enrutamiento hacia los 4 microservicios de negocio desacoplados, aplicando políticas globales de CORS para la SPA en React y aislando las bases de datos independientes.

---

## 1. Clonación de la Suite Completa de EduSaldo

Para clonar la solución completa con el Gateway, los 4 microservicios, el Frontend SPA y el repositorio de documentación en un mismo directorio contenedor:

```bash
mkdir EduSaldo
cd EduSaldo

# 1. API Gateway Central (Orquestador)
git clone https://github.com/antoniojarasanchez/edusaldo-api-gateway.git

# 2. Los 4 Microservicios Backend
git clone https://github.com/antoniojarasanchez/edusaldo-ms-auth-usuarios.git
git clone https://github.com/antoniojarasanchez/edusaldo-ms-alumnos-saldos.git
git clone https://github.com/antoniojarasanchez/edusaldo-ms-productos-inventario.git
git clone https://github.com/antoniojarasanchez/edusaldo-ms-ventas-reservas.git

# 3. Frontend SPA (Repositorio Oficial)
git clone https://github.com/Flosotoo/paginaWeb.git

# 4. Repositorio de Documentación Centralizada
git clone https://github.com/antoniojarasanchez/edusaldo-docs.git
```

---

## 2. Topología de Red y Enrutamiento

Toda solicitud del cliente o frontend apunta exclusivamente a `http://localhost:8090`. El Gateway redirige de forma transparente al microservicio dueño del dominio:

| Microservicio | Puerto | Rutas Enrutadas por el Gateway | Swagger UI Local |
| :--- | :---: | :--- | :--- |
| **Auth y Usuarios** | **8091** | `/api/auth/**`<br>`/api/usuarios/**` | `http://localhost:8091/swagger-ui.html` |
| **Alumnos y Saldos** | **8092** | `/api/alumnos/**`<br>`/api/saldos/**` | `http://localhost:8092/swagger-ui.html` |
| **Productos e Inventario** | **8093** | `/api/productos/**`<br>`/api/inventario/**` | `http://localhost:8093/swagger-ui.html` |
| **Ventas y Reservas** | **8094** | `/api/ventas/**`<br>`/api/reservas/**` | `http://localhost:8094/swagger-ui.html` |

### Seguridad CORS
El Gateway expone cabeceras `Access-Control-Allow-Origin` para los orígenes de desarrollo (`http://localhost:5173`, `http://localhost:4173`, `http://localhost:3000`), permitiendo métodos `GET`, `POST`, `PUT`, `DELETE` y `OPTIONS`.

---

## 3. Scripts de Arranque Simultáneo y Pruebas

Toda la operativa, scripts de inicialización y baterías de prueba están centralizados en la carpeta [`../scripts/`](../scripts/):

### Arranque Simultáneo de Servicios:
- **Windows (PowerShell):** `.\backend\scripts\arrancar_servicios.ps1`
- **Multiplataforma (Python):** `python backend/scripts/arrancar_servicios.py`

### Guías y Baterías de Prueba:
- 📖 **[Manual Operativo, Despliegue y Swagger UI](../scripts/README.md):** Guía completa de MySQL, arranque y pruebas manuales.
- 🤖 **Pruebas Automatizadas E2E:** `python backend/scripts/pruebas_http_automaticas.py` o `.\backend\scripts\pruebas_http_automaticas.ps1`
- 📮 **Colección Postman:** [`../scripts/pruebas_postman_coleccion.json`](../scripts/pruebas_postman_coleccion.json)
