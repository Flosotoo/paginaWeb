# Modelo de dominio · Saldos y abonos

Vista de las entidades persistidas principales de `db_saldos`. Los identificadores de alumno, apoderado, reserva y entrega pertenecen a otros servicios y no son claves foráneas entre bases.

```mermaid
classDiagram
  direction LR
  class CuentaSaldo {
    +Long id
    +Long idEstablecimiento
    +Long alumnoId
    +int saldoActual
    +int saldoComprometido
    +Long version
  }
  class Abono {
    +Long id
    +Long idEstablecimiento
    +Long alumnoId
    +Long apoderadoId
    +int monto
    +MedioPagoAbono medioPago
    +EstadoAbono estado
    +String claveOperacion
    +LocalDateTime fechaCreacion
    +LocalDateTime fechaResolucion
  }
  class PagoWebpaySimulado {
    +Long id
    +Long abonoId
    +String referenciaPago
    +String resultado
    +LocalDateTime fechaResultado
  }
  class CompromisoSaldo {
    +Long id
    +Long cuentaSaldoId
    +Long reservaId
    +int montoClp
    +String estado
  }
  class MovimientoSaldo {
    +Long id
    +TipoMovimientoSaldo tipo
    +int monto
    +int saldoResultante
    +Long entregaId
    +Long operacionCompensacionId
    +String referenciaUnica
  }
  class ConstanciaDevolucionSaldo {
    +Long id
    +Long cuentaSaldoId
    +Long movimientoSaldoId
    +Long administradorId
    +Long apoderadoId
    +int montoClp
    +String medio
    +String referencia
    +String motivo
  }
  class AlertaSaldoBajo {
    +Long id
    +Long cuentaSaldoId
    +int umbralAplicadoClp
    +boolean activa
    +LocalDateTime fechaUltimoAviso
  }
  class NotificacionSaldoPendiente {
    +Long id
    +Long alertaSaldoBajoId
    +Long alumnoId
    +String claveEvento
    +String estado
    +int intentos
    +LocalDateTime siguienteIntento
  }
  CuentaSaldo "1" -- "0..*" Abono
  Abono "1" -- "0..1" PagoWebpaySimulado
  CuentaSaldo "1" -- "0..*" CompromisoSaldo
  CuentaSaldo "1" -- "0..*" MovimientoSaldo
  CuentaSaldo "1" -- "0..*" ConstanciaDevolucionSaldo
  MovimientoSaldo "1" -- "0..1" ConstanciaDevolucionSaldo
  CuentaSaldo "1" -- "0..1" AlertaSaldoBajo
  AlertaSaldoBajo "1" -- "0..*" NotificacionSaldoPendiente
  note for CuentaSaldo "saldoDisponible = saldoActual - saldoComprometido >= 0"
```

Los abonos utilizan una pasarela simulada; no se procesa dinero real. La bandeja de alerta de saldo bajo está en revisión y su estado no implica envío de correo real.
