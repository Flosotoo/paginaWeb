# Guion de Defensa Docente: Arquitectura e Invariantes de Negocio · EduSaldo

Este documento contiene las respuestas y justificaciones técnicas exactas ante las preguntas más difíciles y minuciosas que una comisión o profesor de arquitectura de software formulará sobre EduSaldo.

---

## 1. Arquitectura General y Microservicios

### P1: "¿Por qué dividieron el sistema en 4 microservicios y un API Gateway en vez de hacer un monolito tradicional?"
> **Respuesta:**
> *"Profesor, la división sigue el principio de **Bounded Contexts (Contextos Delimitados)** de Domain-Driven Design (DDD):*
> 1. *`ms-auth-usuarios` (8091): Gestiona la **identidad, seguridad institucional y vínculos familiares**.*
> 2. *`ms-alumnos-saldos` (8092): Gestiona la **contabilidad financiera y el libro mayor inmutable (Ledger)** de saldos prepagados.*
> 3. *`ms-productos-inventario` (8093): Gestiona el **catálogo físico y el kardex de existencias de bodega**.*
> 4. *`ms-ventas-reservas` (8094): Orquesta el **ciclo logístico de pedidos, preparación, entregas y devoluciones**.*
> *El **API Gateway (8090)** actúa como único punto de entrada (Reverse Proxy) desacoplando a los clientes web de la topología interna, enrutando peticiones y protegiendo los puertos internos."*

### P2: "¿Por qué cada microservicio tiene su propia base de datos MySQL?"
> **Respuesta:**
> *"Por la regla arquitectónica fundamental de **Database-per-Service**. Si los 4 microservicios compartieran una sola base de datos o cruzaran `FOREIGN KEY` entre esquemas distintos, tendríamos un 'monolito distribuido': un cambio en una tabla rompería a los demás servicios y un bloqueo de tabla (lock) en inventario detendría la autenticación. Cada microservicio es dueño absoluto de sus tablas y solo se comunican mediante APIs REST síncronas tipadas (S01 a S11) o eventos asíncronos persistentes (A01 a A03)."*

---

## 2. Modelo de Dominio, Herencia y Roles de Usuario

### P3: "¿Por qué en `usuarios` usaron herencia de tabla única (`SINGLE_TABLE`)?"
> **Respuesta:**
> *"Porque todos los actores del colegio comparten los mismos atributos base de identidad (`rut`, `primerNombre`, `primerApellido`, `correo`, `passwordHash`, `estado`, `intentosFallidos`). `SINGLE_TABLE` con `@DiscriminatorColumn(name = 'tipo_usuario')` ofrece el mejor rendimiento en MySQL (cero costo de `JOIN` en el login), mientras que las subclases polimórficas (`Alumno`, `Apoderado`, `Encargado`, `Administrador`) encapsulan su comportamiento y reglas específicas."*

### P4: "¿Por qué el sistema no acepta transferencias bancarias manuales y opera exclusivamente con pasarela en línea?"
> **Respuesta:**
> *"Por tres razones críticas de ingeniería y negocio:*
> * 1. **Prevención de Fraude y Riesgo Operacional:** Las transferencias bancarias exigen subir comprobantes que pueden ser adulterados o reutilizados, generando colas de espera con revisión humana propensas a error.*
> * 2. **Conciliación Contable Inmediata e Idempotente:** El flujo Webpay opera en dos fases (`/iniciar` con token UUID transaccional y `/confirmar` con acreditación atómica). Si la pasarela reintenta la confirmación por intermitencias de red, el sistema detecta el token ya procesado y no duplica saldo.*
> * 3. **Reducción de Complejidad y Desacoplamiento:** Eliminamos intermediarios ambiguos (apoderados revisores de comprobantes) y suprimimos la dependencia inter-servicio S12, garantizando transacciones 100% automatizadas y auditadas en milisegundos."*

### P5: "¿Por qué un alumno no puede existir sin apoderado?"
> **Respuesta:**
> *"Por la **Invariante de No Orfandad (HU11, HU12, HU15)**. En un colegio, un alumno es un menor de edad o dependiente económico que no puede celebrar contratos ni asumir deudas por sí mismo. Toda cuenta de saldo requiere un responsable legal. Por eso implementamos la entidad relacional `ApoderadoAlumno` con clave compuesta y desvinculación lógica con motivo (`desvincular(motivo)`): el sistema prohíbe desvincular al último apoderado activo de un alumno activo (HU12 CA3) y el alta es atómica (HU15)."*

### P6: "¿Cómo opera la regla de los 12 años en los Alumnos?"
> **Respuesta:**
> *"Por la regla de **Autonomía Progresiva (HU09, HU14, HU24, HU34)**:*
> * **Menores de 12 años:** Su cuenta nace en estado `ACTIVA`, pero `puedeIniciarSesion()` retorna `false`. No tienen acceso web ni pueden reservar en línea (lo hace su apoderado), pero **sí pueden ser atendidos presencialmente en el mesón de la librería** entregando su RUT (HU34).*
> * **12 años o más:** Su cuenta nace en `PRIMER_ACCESO`, tienen acceso al portal web, cambian su clave provisoria y pueden armar reservas por sí mismos."*

---

## 3. Invariantes Financieras y de Inventario

### P7: "¿Por qué precios, saldos y montos son de tipo `int` y no `double` o `float`?"
> **Respuesta:**
> *"Porque en la República de Chile la moneda oficial es el **Peso Chileno (CLP)**, el cual por ley no posee centavos ni decimales. Además, usar punto flotante (`float`/`double`) en sistemas financieros introduce errores de redondeo binario IEEE 754 inaceptables. Un entero (`int` de 32 bits en Java o `BIGINT` en MySQL) garantiza precisión matemática absoluta en cada suma y resta contable."*

### P8: "¿Cómo garantizan que una cuenta nunca quede con saldo negativo?"
> **Respuesta:**
> *"A través del método de dominio `CuentaSaldo.retenerSaldo(monto)` y la condición matemática:*
> $$\text{saldoDisponible} = \text{saldoActual} - \text{saldoComprometido} \ge \text{monto}$$
> *Si el monto supera el saldo disponible, el dominio arroja de inmediato `IllegalStateException: Saldo insuficiente`, y el manejador global devuelve HTTP `422 Unprocessable Entity`. Jamás se autoriza una retención o débito en descubierto."*

### P9: "¿Por qué el Conteo Físico (HU43) no actualiza directamente el stock en bodega?"
> **Respuesta:**
> *"Por control interno contable y prevención de fraude. Un conteo físico es una auditoría visual realizada por el Encargado de librería. Si el conteo modificara el stock automáticamente, un encargado podría ocultar pérdidas o robos simplemente ingresando que hay menos unidades. Por eso, `ConteoFisico` solo registra las diferencias en `detalles_conteo_fisico`. Si hay discrepancias, el Encargado debe levantar formalmente una `SolicitudAjusteStock` (HU44), la cual debe ser **auditada y aprobada exclusivamente por el Administrador** (HU45)."*

### P10: "¿Qué previene que un Encargado se apruebe sus propios ajustes de inventario?"
> **Respuesta:**
> *"La **Segregación de Funciones (HU44 CA3)**. En `SolicitudAjusteStock.aprobar(adminId)` existe la guarda:*
> `if (adminId != null && adminId.equals(this.encargadoId)) throw new IllegalStateException("El encargado que solicitó el ajuste no puede aprobar ni rechazar su propia solicitud.");`
> *El sistema rechaza con HTTP 422 si el solicitante intenta actuar como juez y parte."*

---

## 4. Transaccionalidad Distribuida y Resiliencia

### P11: "¿Qué pasa si al crear una reserva se compromete el saldo en `ms-saldos` pero se cae el servicio de `ms-inventario`?"
> **Respuesta:**
> *"Implementamos el **Patrón Saga Orquestado con Compensación Automática (S05)** en `ReservaService`. Si tras retener el saldo (`saldosClient.comprometerSaldo`), la llamada a inventario (`inventarioClient.reservarStock`) falla por timeout o falta de stock, el bloque `catch` ejecuta la transacción compensatoria:*
> `saldosClient.liberarSaldo(alumnoId, total, codigo);`
> *Además, se persiste una `OperacionDistribuida` con estado `COMPENSADA` para garantizar que la cuenta del alumno no sufra cobros fantasmas."*

### P12: "¿Por qué una reserva debe estar obligatoriamente en `LISTA_PARA_RETIRO` antes de entregar?"
> **Respuesta:**
> *"Por la regla de trazabilidad **HU33 CA1**. En `Reserva.confirmarRetiroYGenerarEntrega`:*
> `if (this.estado != EstadoReserva.LISTA_PARA_RETIRO) throw new IllegalStateException("La reserva no está lista para entrega...");`
> *Esto garantiza que ningún funcionario entregue materiales que no hayan sido previamente empaquetados y registrados con `preparadaPorId` y `fechaPreparacion` (HU31 CA2), evitando confusiones en el mesón."*

---

## 5. Aislamiento Multitenant (Multiestablecimiento)

### P13: "¿Cómo aseguran que un colegio no vea los productos o reservas de otro colegio?"
> **Respuesta:**
> *"A través de **Multitenancy Lógico con Tenant Scoping**:*
> 1. *Cada tabla en los 4 microservicios almacena obligatoriamente `id_establecimiento BIGINT NOT NULL` con índice.*
> 2. *En el login, el JWT del usuario lleva inyectado su `idEstablecimiento`.*
> 3. *En los repositorios JPA, ninguna consulta lista datos globales sin filtrar por el colegio del contexto (`findByIdEstablecimientoAndActivoTrue`). Si un usuario de un colegio intenta solicitar un ID de otro colegio, el backend responde HTTP `404 Not Found` o `422`."*
