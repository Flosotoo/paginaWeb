# EduSaldo · MS Productos e Inventario (Puerto 8093)

Microservicio responsable del catálogo de productos escolares, control de stock y solicitudes de ajustes de inventario en la plataforma **EduSaldo**.

---

## 1. Ficha Técnica

- **Puerto:** `8093`
- **Base de Datos MySQL:** `db_inventario`
- **Swagger UI:** `http://localhost:8093/swagger-ui.html`

---

## 2. Responsabilidades de Dominio

1. **Catálogo de Productos y Categorías:**
   - SKU, código de barras, descripción y categoría.
   - Precios en pesos chilenos enteros (`int` en CLP).
2. **Modelo de Stock e Invariante de Inventario:**
   - Cumplimiento estricto de la invariante:
     $$\text{stockDisponible} = \text{stockFisico} - \text{stockReservado} \ge 0$$
   - Alerta por stock crítico configurado a nivel de producto.
3. **Flujo de Ajustes de Stock:**
   - Levantamiento de `SolicitudAjusteStock` por parte del **Encargado** (por merma, daño o diferencia de conteo).
   - Aprobación o rechazo exclusivo por parte del **Administrador**.
   - Asiento del `MovimientoInventario` correspondiente solo tras la aprobación.
4. **Ingreso Manual de Stock:**
   - Registro de recepción de mercadería física en bodega con proveedor y documento de respaldo.

---

## 3. Endpoints Clave y Operaciones REST

- `GET /api/productos`: Catálogo de productos disponibles con stock.
- `POST /api/inventario/ingreso`: Registro de recepciones físicas en bodega.
- `POST /api/inventario/ajuste`: Creación de solicitudes de ajuste (Encargado).
- `PUT /api/inventario/ajuste/{id}/aprobar`: Aprobación de ajuste de stock (Administrador).
- `S03`: Consulta de productos, precios y disponibilidad (consumido por MS Reservas).
- `S04`: Comprometer existencias (`stockReservado++`, consumido por MS Reservas).
- `S06`: Liberar existencias reservadas (`stockReservado--`, consumido por MS Reservas).
- `S08`: Salida física definitiva (`stockFisico--`, consumido por MS Reservas).
- `S10`: Reingreso de artículos por devolución (`stockFisico++`, consumido por MS Reservas).

---

## 4. Ejecución Local

### Prerrequisitos:
- Java 17 o superior
- Base de datos MySQL con esquema `db_inventario` creado.

### Comandos:
```bash
# Compilar y ejecutar pruebas
mvn clean test

# Levantar el microservicio
mvn spring-boot:run
```
