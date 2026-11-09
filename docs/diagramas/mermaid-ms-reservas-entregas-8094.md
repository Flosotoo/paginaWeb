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
  +Long canceladaPorId
  +String estadoOperacion
}

class DetalleReserva {
  +Long id
  +Long productoId
  +String nombreProducto
  +int cantidad
  +int precioUnitario
}

class Entrega {
  +Long id
  +Long idEstablecimiento
  +String numero
  +Long reservaId
  +Long alumnoId
  +OrigenEntrega origen
  +int total
  +Long encargadoId
  +LocalDateTime fecha
}

class DetalleEntrega {
  +int cantidadDevuelta
  +Long id
  +Long productoId
  +String nombreProducto
  +int cantidad
  +int precioUnitario
}

class Devolucion {
  +Long id
  +Long idEstablecimiento
  +Long encargadoId
  +Long entregaId
  +Long alumnoId
  +LocalDateTime fecha
  +String motivo
  +int totalReintegro
}

class DetalleDevolucion {
  +Long id
  +Long detalleEntregaId
  +Long productoId
  +int cantidad
  +int montoReintegro
}

class OperacionDistribuida {
  +Long id
  +String claveIdempotencia
  +String tipo
  +Long reservaId
  +Long entregaId
  +Long devolucionId
  +String estado
  +String direccion
  +String pasosConfirmados
  +LocalDateTime ejecucionHasta
}

class NotificacionPendiente {
  +Long id
  +Long idEstablecimiento
  +Long reservaId
  +Long entregaId
  +Long alumnoId
  +String tipoEvento
  +String referenciaOperacion
  +String destinatarioCorreo
  +String asunto
  +String mensaje
  +String estado
  +int intentos
  +LocalDateTime fechaCreacion
  +LocalDateTime fechaEnvio
  +LocalDateTime siguienteIntento
}

Reserva "1" *-- "1..*" DetalleReserva : contiene
Reserva "0..1" <-- "0..1" Entrega : origina

Entrega "1" *-- "1..*" DetalleEntrega : contiene
Entrega "1" <-- "0..*" Devolucion : recibe
Devolucion "1" *-- "1..*" DetalleDevolucion : contiene
DetalleEntrega "1" -- "0..*" DetalleDevolucion : corresponde a
Reserva "0..1" -- "0..*" OperacionDistribuida
Entrega "0..1" -- "0..*" OperacionDistribuida
Devolucion "0..1" -- "0..*" OperacionDistribuida
Reserva "0..1" -- "0..*" NotificacionPendiente
Entrega "0..1" -- "0..*" NotificacionPendiente

note for Reserva "Trazabilidad de Preparacion (HU31 CA2): Registra preparadaPorId y fechaPreparacion al pasar a LISTA_PARA_RETIRO."
note for Reserva "Invariante de Entrega (HU33 CA1): Exige estrictamente que la reserva este en LISTA_PARA_RETIRO antes de confirmar retiro."
note for Reserva "Politica de Cancelacion: Apoderados/Alumnos solo cancelan en PENDIENTE (HU28); Encargados en PENDIENTE o LISTA_PARA_RETIRO (HU32)."
note for Entrega "Atencion en Meson (HU34): Permite entrega directa presencial a menores de 12 anos debitando de su saldo disponible."
```
