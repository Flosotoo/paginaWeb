# EduSaldo 2.0 — Etapa 16 · Reservar materiales

Abre `index.html` con Live Server. Acceso de demostración: `apoderado@edusaldo.cl` / `1234`.

## Flujo
- Selecciona Sofía (9 años) → Reservar materiales. Tomás (13 años) no tiene reserva anticipada.
- Elige categoría, cantidad y agrega productos al carrito. El sistema valida saldo disponible y unidades no comprometidas.
- Confirma reserva. Queda **PENDIENTE** y compromete saldo y unidades; no descuenta el saldo contable ni el stock físico hasta una futura entrega.
- En Mis reservas se muestran el código, productos, cantidades y total comprometido.
- Los abonos aprobados con Webpay simulado aumentan el saldo. La cartola registra los abonos y entregas confirmadas; las reservas pendientes no son movimientos contables.

**Limitaciones:** prototipo académico, datos ficticios y almacenamiento local al navegador; no hay backend, Webpay real, preparación/entrega ni devoluciones implementadas. No hay sincronización entre dispositivos. No ingreses información bancaria real.

## Etapa 17 — Catálogo ampliado
Se agregaron Ciencias y tecnología y Otros materiales, además de nuevos artículos en Geometría, Papeles y Arte. Los valores y existencias son **datos ficticios para demostración**; no son precios ni stock de una librería real. Los productos nuevos se incorporan aunque ya existan datos de demostración en localStorage, sin borrar abonos ni reservas previas.


## Etapa 18 — Módulo del encargado

Ingresa con `encargado@edusaldo.cl` / `1234` desde `index.html`. El panel muestra reservas pendientes, pedidos preparados y disponibilidad crítica (5 unidades o menos).

- **Reservas:** el apoderado confirma la reserva; el encargado escanea **cada unidad** del pedido y luego presiona **Listo para entrega** para pasarla a PREPARADA. Solo al entregar se descuenta el saldo contable y stock físico; las reservas pendientes o preparadas comprometen saldo y unidades.
- **Entrega directa:** solo alumnos de 12 años o más. Selecciona alumno, ingresa código de barras (Enter simula lector USB), revisa el total y confirma. No hay venta ni recepción de dinero.
- **Inventario:** stock físico, comprometido y disponible para nuevas solicitudes.
- **Devoluciones:** por unidad de una entrega previa, sin exceder lo entregado. Reintegra el saldo; el stock se repone solo si el producto es reutilizable.

**Prueba sugerida:** entra como apoderado y crea una reserva para Sofía; cierra sesión y entra como encargado para prepararla, verificar códigos desde Inventario y entregarla; vuelve al apoderado y comprueba saldo, cartola y estado ENTREGADA. Después prueba entrega directa para Tomás y devolución.

**Alcance:** prototipo académico con datos ficticios, credenciales de demostración y localStorage. No hay sincronización entre computadores, backend, Webpay real ni autorización segura de reversas. No usar para operaciones reales.

## Etapa 19 — Preparación por escaneo y entrega por bolsa

1. Crear reserva como apoderado. El saldo y las unidades quedan comprometidos.
2. Encargado → Reservas → Comenzar a escanear artículos. Escanear cada unidad al colocarla en la bolsa. El progreso se guarda en localStorage; estado EN_PREPARACION.
3. Al escanear la última unidad, aparece **Listo para entrega**. Al presionarlo, pasa a PREPARADA y genera `BOL-<ID_RESERVA>`. Imprimir etiqueta con código de barras Code 39 y pegarla en la bolsa.
4. Al retirar, escanear SOLO la etiqueta de bolsa; confirmar entrega. Recién entonces se descuenta el saldo contable y stock físico, se registra el movimiento y el estado ENTREGADA.
5. Para demostración sin pistola, escribir el código y pulsar Enter. Inventario muestra códigos de artículos. La impresión depende de la configuración de impresora y el lector debe admitir Code 39; el prototipo no controla hardware ni sincroniza dispositivos.

**Actualización desde Etapa 18:** se conservan las reservas y saldos guardados en el mismo navegador. Las reservas ya marcadas PREPARADA en la versión anterior podrán etiquetarse y entregarse con el nuevo flujo; para probar escaneo desde cero, crea una nueva reserva.

## Etapa 23 — Confirmación de bolsa lista

Incluye la corrección de contadores de Etapa 22 (NaN → números). El escaneo completo no cambia el estado automáticamente: aparece «Listo para entrega» y al pulsarlo se genera la etiqueta de bolsa con opción de impresión. Al retirar, se escanea el código de la bolsa y se confirma la entrega. No se borran datos de demostración guardados en el navegador.


## Etapa 24: reservas del encargado
Inicio: indicadores de reservas por preparar, reservas pendientes de entrega y stock crítico. Reservas abre dos rutas separadas. En preparación, escanear todas las unidades bloquea nuevos ingresos y habilita Generar etiqueta. El estado ETIQUETA_PENDIENTE conserva el compromiso de saldo/stock. El navegador no puede verificar si la impresión física terminó correctamente; por eso el encargado debe pulsar Confirmar etiqueta impresa tras pegarla. Entonces pasa a PREPARADA (pendiente de entrega). En retiro se verifican código de bolsa y credencial ALU-ID, y tras confirmación se descuentan saldo y stock una sola vez. La credencial ALU-ID es ficticia para esta demostración.


## Etapa 25 — Corrección de impresión de etiqueta
Se unificaron las reglas de impresión que se contradecían y ocultaban la etiqueta. Solo se imprime la etiqueta con alumno, reserva y código de barras; se espera a que el navegador dibuje la etiqueta antes de abrir la impresión. No se alteran reservas ni saldos.


## Etapa 26: reservas entregadas

En Reservas existe un tercer camino, «Reservas entregadas», de consulta exclusiva. Muestra alumno, curso, reserva, total, fecha/hora y detalle de artículos. El inicio del encargado muestra además un cuarto indicador con el número de reservas entregadas. No se modifica el escaneo, la impresión ni la entrega aprobados en la Etapa 25.


## Etapa 27 — Navbar responsive (carpeta oficial)
Se aplicaron los cambios de navegación adaptable directamente sobre el ZIP Etapa 26 entregado para la evaluación. El archivo ZIP de esta entrega contiene una sola carpeta EDUSALDO_PROYECTO_OFICIAL con index.html, assets y pages directamente dentro. Antes de reemplazar la carpeta de trabajo, guardar una copia de seguridad y verificar Live Server. No copiar una carpeta completa dentro de otra ni ejecutar git init en un ZIP extraído.


## Etapa 28 — Mensajes modernos
Se reemplazaron los cuadros nativos alert/confirm del encargado por confirmaciones y notificaciones con el diseño de EduSaldo en entregas de reservas, entregas directas y devoluciones. Las confirmaciones permiten cancelar, cerrar con Escape y mantienen el foco de teclado. Se conserva la lógica de saldo, cartola y stock. El proyecto sigue siendo un prototipo local con datos en localStorage.


## Etapa 28 — Consulta y reimpresión de etiquetas
En Encargado → Reservas → Reservas pendientes de entrega se muestra el código de bolsa guardado para cada reserva. Al abrir «Registrar entrega», el encargado puede reimprimir la misma etiqueta sin cambiar el estado de la reserva ni descontar saldo o stock. La entrega sigue exigiendo código de bolsa y credencial del alumno.
