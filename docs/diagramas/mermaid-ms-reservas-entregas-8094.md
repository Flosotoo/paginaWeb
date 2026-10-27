# Modelo de dominio · MS Reservas, Entregas y Devoluciones (8094 · db_reservas)

```mermaid
classDiagram
direction LR

class Reserva {
  +Long id
  +Long idEstablecimiento
  +String codigo
  +Long alumnoId
  +Long creadaPorId
  +EstadoReserva estado
  +int total
  +LocalDateTime fechaCreacion
  +Long preparadaPorId
  +LocalDateTime fechaPreparacion
  +String motivoCancelacion
  +Long usuarioCancelacionId
  +LocalDateTime fechaCancelacion
  +confirmar()
  +marcarListaParaRetiro(encargadoId)
  +cancelar(usuarioId, rol, motivo)
  +confirmarRetiroYGenerarEntrega(encargadoId) Entrega
}

class DetalleReserva {
  +Long id
  +Long productoId
  +String nombreProducto
  +int cantidad
  +int precioUnitario
  +int subtotal
}

class Entrega {
  +Long id
  +Long idEstablecimiento
  +String numeroEntrega
  +Long reservaId
  +Long alumnoId
  +OrigenEntrega origen
  +int total
  +Long encargadoId
  +LocalDateTime fechaEntrega
  +agregarDetalle(productoId, nombre, cantidad, precio)
}

class DetalleEntrega {
  +Long id
  +Long productoId
  +String nombreProducto
  +int cantidad
  +int precioUnitario
  +int subtotal
}

class Devolucion {
  +Long id
  +Long idEstablecimiento
  +Long encargadoId
  +LocalDateTime fechaDevolucion
  +String motivo
  +int totalReintegrado
  +agregarDetalle(detalleEntrega, cantidad, monto)
}

class DetalleDevolucion {
  +Long id
  +int cantidad
  +int montoReintegrado
}

class OperacionDistribuida {
  +Long id
  +String codigoOperacion
  +String tipo
  +Long reservaId
  +Long entregaId
  +Long devolucionId
  +String estado
  +LocalDateTime fechaCreacion
  +marcarCompletada()
  +marcarCompensada()
}

class NotificacionPendiente {
  +Long id
  +Long idEstablecimiento
  +Long reservaId
  +Long entregaId
  +Long alumnoId
  +String tipo
  +String destinatario
  +String asunto
  +String mensaje
  +String estado
  +int intentos
  +LocalDateTime fechaCreacion
  +marcarEnviada()
  +incrementarIntento()
}

Reserva "1" *-- "1..*" DetalleReserva : contiene
Reserva "0..1" <-- "0..1" Entrega : origina

Entrega "1" *-- "1..*" DetalleEntrega : contiene
Entrega "1" <-- "0..*" Devolucion : recibe
Devolucion "1" *-- "1..*" DetalleDevolucion : contiene

note for Reserva "Trazabilidad de Preparacion (HU31 CA2): Registra preparadaPorId y fechaPreparacion al pasar a LISTA_PARA_RETIRO."
note for Reserva "Invariante de Entrega (HU33 CA1): Exige estrictamente que la reserva este en LISTA_PARA_RETIRO antes de confirmar retiro."
note for Reserva "Politica de Cancelacion: Apoderados/Alumnos solo cancelan en PENDIENTE (HU28); Encargados en PENDIENTE o LISTA_PARA_RETIRO (HU32)."
note for Entrega "Atencion en Meson (HU34): Permite entrega directa presencial a menores de 12 anos debitando de su saldo disponible."
```
