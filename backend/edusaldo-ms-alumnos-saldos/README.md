# EduSaldo · MS Alumnos y Saldos (Puerto 8092)

Microservicio responsable de los alumnos, la relación apoderado-alumno, las cuentas corrientes prepagadas y el libro mayor inmutable de movimientos de saldo en la plataforma **EduSaldo**.

---

## 1. Ficha Técnica

- **Puerto:** `8092`
- **Base de Datos MySQL:** `db_saldos`
- **Swagger UI:** `http://localhost:8092/swagger-ui.html`

---

## 2. Responsabilidades de Dominio

1. **Gestión de Alumnos y Asociación con Apoderados:**
   - Datos personales y curso del alumno.
   - Asociación N:M `ApoderadoAlumno` pura (auditoría con motivo y fecha en caso de desvinculación).
   - Alta atómica (alumno + apoderado + saldo) con compensación ante fallos.
2. **Cuentas de Saldo e Invariante Financiera:**
   - Cumplimiento estricto de la invariante:
     $$\text{saldoDisponible} = \text{saldoActual} - \text{saldoComprometido} \ge 0$$
   - Todos los montos financieros se expresan en números enteros (`int` en CLP).
3. **Libro Mayor Inmutable (`MovimientoSaldo`):**
   - Registro de abonos, compras, reservas, retenciones y ajustes.
4. **Pasarela de Pago Simulada:**
   - Abonos Webpay con token de transacción y bloqueo temporal de concurrencia.
5. **Liquidación por Retiro:**
   - Cierre de cuenta y devolución formal del dinero al apoderado cuando el alumno egresa o se retira del colegio.

---

## 3. Endpoints Clave y Operaciones REST

- `GET /api/saldos/alumno/{alumnoId}`: Consulta de saldo actual y disponible.
- `POST /api/saldos/abono`: Registro de abonos vía pasarela Webpay simulada.
- `S02`: Comprometer saldo por reserva (consumido por MS Reservas).
- `S05`: Liberar saldo comprometido por cancelación (consumido por MS Reservas).
- `S07`: Confirmar débito definitivo por entrega en mesón (consumido por MS Reservas).
- `S09`: Reintegrar saldo por devolución de mercadería (consumido por MS Reservas).
- `A03`: Emisión de alerta asíncrona por saldo bajo (`cruzoUmbralSaldoBajo()`).

---

## 4. Ejecución Local

### Prerrequisitos:
- Java 17 o superior
- Base de datos MySQL con esquema `db_saldos` creado.

### Comandos:
```bash
# Compilar y ejecutar pruebas
mvn clean test

# Levantar el microservicio
mvn spring-boot:run
```
