# Documentación de EduSaldo

EduSaldo es una aplicación local para gestionar usuarios, saldos, inventario, reservas y entregas de materiales por establecimiento. El repositorio contiene el frontend React, un API Gateway y cuatro microservicios Spring Boot; cada microservicio administra su propio esquema MariaDB. Las instrucciones de instalación y ejecución están en el [README principal](../README.md).

## Documentos

- [Planilla de requerimientos](EduSaldo%20-%20Plantilla%20Gesti%C3%B3n%20Requerimientos.xlsx): historias y criterios funcionales.
- [Arquitectura de sistema](EduSaldo%20-%20Arquitectura%20de%20Sistema.docx): documento de arquitectura en formato Word.
- [Diagramas](diagramas/): arquitectura general, comunicaciones y modelos por microservicio.

Los documentos y diagramas se contrastan con el código y las pruebas automatizadas del repositorio.

## Componentes

| Componente | Puerto local | Persistencia | Responsabilidad principal |
| --- | --- | --- | --- |
| Frontend React | 5173 | Navegador | Interfaz web conectada al API Gateway |
| API Gateway | 8090 | — | Entrada y autorización de solicitudes |
| Usuarios y autenticación | 8091 | `db_usuarios` | Identidad, sesiones, usuarios, vínculos y configuración |
| Alumnos y saldos | 8092 | `db_saldos` | Cuentas, abonos y movimientos de saldo |
| Productos e inventario | 8093 | `db_inventario` | Catálogo, existencias y movimientos de inventario |
| Ventas y reservas | 8094 | `db_reservas` | Reservas, entregas y devoluciones |

El navegador consume exclusivamente el gateway. Los servicios se comunican mediante las operaciones HTTP internas `S01`–`S11`. Los saldos, precios y cantidades se representan como enteros CLP; las invariantes de saldo y stock disponible se validan en el servidor. Los pagos y correos son simulados: no implican integración con una pasarela bancaria real ni envío externo por servidor SMTP.

Los esquemas y semillas del repositorio permiten reconstruir las bases locales. La reconstrucción elimina los datos existentes de los cuatro esquemas, por lo que debe usarse solo cuando corresponda. Los scripts de comprobación verifican compilación, pruebas unitarias, esquemas, concurrencia, contratos HTTP y flujos de navegador.

## Funcionalidades con alcance parcial documentado

- **Notificaciones y correos simulados (`HU05`, `HU22`, `HU29`, `HU33`, `HU34`):** los avisos de recuperación de contraseña, confirmación de abonos, creación/preparación de reservas y entregas persisten en bandejas locales (`CorreoSimulado`, `NotificacionSaldoPendiente`, `NotificacionPendiente`) con su detalle completo, sin despacho mediante servidor SMTP externo.
- **Inactivación de alumnos (`HU14`, `HU55`):** la baja de cuentas de alumnos permanece suspendida (`HTTP 422` en backend y acción deshabilitada en interfaz) para evitar condiciones de carrera (TOCTOU) sobre reservas y saldos sin añadir una operación síncrona adicional fuera de `S01`–`S11`. La inactivación de apoderados y encargados y la conservación histórica operan normalmente.
- **Exportación CSV (`HU49`):** el endpoint `/api/saldos/reportes/cuentas/csv` exporta en enteros CLP el reporte de cuentas, movimientos y abonos del período y establecimiento autenticado; no genera un archivo CSV separado para el detalle físico de entregas de inventario.
- **Auditoría distribuida y rechazos de seguridad (`HU52`):** `ms-auth-usuarios` persiste la auditoría de accesos, usuarios, vínculos, configuración y rechazos `403` sin registrar parámetros sensibles. Ante una indisponibilidad de `ms-auth-usuarios`, el Gateway mantiene el bloqueo de acceso (`403`/`503`) con registro *best-effort*, y la vista administrativa consolida auditoría de usuarios, ajustes aprobados de inventario y actas de saldo desde sus servicios de origen.
