# EduSaldo · MS Reservas y Entregas (Puerto 8094)

Microservicio responsable del ciclo de vida de las reservas de útiles escolares, entregas presenciales por concepto y devoluciones en la plataforma **EduSaldo**.

---

## 1. Ficha Técnica

- **Puerto:** `8094`
- **Base de Datos MySQL:** `db_reservas`
- **Swagger UI:** `http://localhost:8094/swagger-ui.html`

---

## 2. Responsabilidades de Dominio

1. **Gestión de Reservas y Carritos Multilínea:**
   - Reserva por parte del apoderado o alumno ($\ge$ 12 años).
   - Estados: `PENDIENTE` $\rightarrow$ `LISTA_PARA_RETIRO` $\rightarrow$ `ENTREGADA` (o `CANCELADA`).
2. **Trazabilidad Obligatoria de Preparación (HU31 CA2):**
   - Al pasar al estado `LISTA_PARA_RETIRO`, se registran de forma obligatoria:
     - `preparadaPorId : Long` (ID del usuario Encargado).
     - `fechaPreparacion : LocalDateTime` (marca temporal).
3. **Entregas de Materiales por Concepto:**
   - Entrega presencial en mesón de librería consumiendo el saldo previamente retenido o disponible.
   - Sin facturación comercial abierta ni manejo de efectivo en caja.
4. **Devoluciones de Materiales:**
   - Reingreso de productos devueltos y restitución inmediata al saldo del alumno.

---

## 3. Endpoints Clave y Operaciones REST

- `POST /api/reservas`: Creación y confirmación de reservas multilínea.
- `PUT /api/reservas/{id}/preparar`: Registro de preparación de reserva (HU31 CA2).
- `POST /api/ventas/entrega`: Registro de entrega de materiales en mesón.
- `POST /api/ventas/devolucion`: Registro de devolución de materiales.
- Orquesta dependencias: `S01` (Usuarios), `S02`/`S05`/`S07`/`S09` (Saldos) y `S03`/`S04`/`S06`/`S08`/`S10` (Inventario).
- Dispara eventos asíncronos: `A01` (Reserva confirmada) y `A02` (Entrega registrada).

---

## 4. Ejecución Local

### Prerrequisitos:
- Java 17 o superior
- Base de datos MySQL con esquema `db_reservas` creado.

### Comandos:
```bash
# Compilar y ejecutar pruebas
mvn clean test

# Levantar el microservicio
mvn spring-boot:run
```
