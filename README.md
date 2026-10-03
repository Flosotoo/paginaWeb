# EduSaldo 2.0 — Etapa 37.4 definitiva

Cierre del prototipo HTML/CSS/JavaScript antes de Spring Boot y React.

Correcciones finales del Administrador:
- Dashboard alineado visualmente con Apoderado y Encargado.
- Cuenta Librería con retorno al Inicio.
- Inventario y Valorización con solo tres accesos: Creación de Productos, Stock e Inventario.
- Creación de Productos sin listado inferior.
- Stock con Stock valorizado, Stock crítico y Ajuste de stock.
- Stock crítico muestra solo avisos vigentes, del más antiguo al más nuevo.
- Ajuste de stock funcional con motivo y doble autorización.
- Inventarios realizados como histórico con respaldo fotográfico y filtro por año.
- Gestión de Compras con solo Crear Orden de Compra y Maestro de Proveedores.
- Navegación Volver corregida.

Se mantienen las reglas aprobadas de OC, recepción por Encargada, CPP con IVA incluido, facturas, pagos sin parcialidades y doble autorización.


Etapa 37.4 final - permisos Administrador 2: acceso solo a Cuenta Librería en modo consulta, autorizaciones pendientes de ajustes de stock/pagos e historial de sus autorizaciones. No tiene acceso a funciones operativas del Administrador 1.

## Etapa 38 — cierre funcional previo a microservicios
Esta versión incorpora al prototipo navegable las reglas funcionales cerradas del backlog maestro EduSaldo 2.0:
- alta administrativa de cuentas familiares y alumnos, importación CSV y estados ACTIVO/INACTIVO;
- sin autorregistro; contraseña temporal, PRIMER_ACCESO, cambio obligatorio, bloqueo a 5 intentos y restablecimiento administrativo;
- una cuenta familiar puede agrupar varios alumnos, cada uno con saldo e historial independiente;
- reservas con saldo/stock comprometido; estados PENDIENTE → EN_PREPARACION/ETIQUETA → LISTA_PARA_RETIRO → ENTREGADA, con CANCELADA antes de entrega;
- la entrega finaliza venta/saldo/stock; una entrega no se cancela: se usa devolución;
- saldo negativo prohibido en reserva y entrega directa;
- alerta persistente de saldo bajo con umbral configurable ($3.000 inicial) y un solo evento de correo simulado por episodio;
- compras, recepciones parciales, inventario, CPP/valorización, precios administrados, pagos con autorización y Cuenta Librería conservados desde Etapa 37.4;
- cierre financiero mensual ABIERTO → EN_REVISION → CERRADO, manual o automático tras plazo configurable (3 días iniciales);
- auditoría de acciones sensibles de solo lectura e inactivación en lugar de borrado de registros con historial.

### Alcance técnico de este ZIP
Este ZIP sigue siendo el prototipo frontend académico HTML/CSS/JavaScript con persistencia local. Los elementos de la planificación E2/E3 que exigen React + TypeScript, Vitest/RTL, Axios, Spring Boot, REST, base de datos, Spring Security/JWT y Swagger pertenecen a la siguiente etapa de implementación. No se simula que esas tecnologías ya existan: este cierre congela el comportamiento funcional que deberá migrarse a esa arquitectura.
