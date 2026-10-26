# Modelo de dominio · MS Saldos y Abonos (8092 · db_saldos)

```mermaid
classDiagram
direction LR

class CuentaSaldo {
  +Long id
  +Long alumnoId
  +Long idEstablecimiento
  +int saldoActual
  +int saldoComprometido
  +Long version
  +LocalDateTime fechaCreacion
  +disponible() int
  +abonarSaldo(monto, referencia, usuarioId) MovimientoSaldo
  +retenerSaldo(monto, reservaId, usuarioId) MovimientoSaldo
  +liberarSaldo(monto, reservaId, usuarioId) MovimientoSaldo
  +cobrarSaldo(monto, reservaId, usuarioId) MovimientoSaldo
  +reintegrarSaldo(monto, referencia, usuarioId) MovimientoSaldo
  +liquidarSaldo(comprobante, adminId) MovimientoSaldo
}

class Abono {
  +Long id
  +Long apoderadoId
  +int monto
  +MetodoPago metodoPago
  +EstadoAbono estado
  +String referencia
  +LocalDateTime fechaCreacion
  +aprobar()
  +rechazar(motivo)
  +estaPendiente() boolean
}

class TransferenciaBancaria {
  +Long id
  +LocalDate fechaTransferencia
  +String comprobanteUrl
  +Long revisadoPorApoderadoId
  +LocalDateTime fechaRevision
  +String motivoRechazo
  +aprobar(revisorApoderadoId)
  +rechazar(revisorApoderadoId, motivo)
}

class CompromisoSaldo {
  +Long id
  +Long reservaId
  +int monto
  +EstadoCompromiso estado
  +LocalDateTime fechaCreacion
  +liberar()
  +consumir()
}

class MovimientoSaldo {
  +Long id
  +TipoMovimientoSaldo tipo
  +int monto
  +int saldoAnterior
  +int saldoNuevo
  +String referencia
  +Long usuarioId
  +LocalDateTime fechaCreacion
}

class ConstanciaDevolucion {
  +Long id
  +int monto
  +String motivo
  +Long administradorId
  +String comprobanteUrl
  +LocalDateTime fechaCreacion
}

class AlertaSaldoBajo {
  +Long id
  +int umbral
  +LocalDateTime fechaAlerta
  +Boolean atendida
  +marcarAtendida()
}

CuentaSaldo "1" *-- "0..*" Abono : registra
Abono "1" *-- "0..1" TransferenciaBancaria : detalla
CuentaSaldo "1" *-- "0..*" CompromisoSaldo : retiene
CuentaSaldo "1" *-- "0..*" MovimientoSaldo : historial
CuentaSaldo "1" *-- "0..*" ConstanciaDevolucion : liquida
CuentaSaldo "1" *-- "0..*" AlertaSaldoBajo : emite

note for CuentaSaldo "Invariante Financiera: saldoDisponible = saldoActual - saldoComprometido >= 0."
note for TransferenciaBancaria "Aprobacion Centro de Padres (HU20 / S12): Solo un Apoderado con autorizadoCentroPadres=true puede resolverla."
note for MovimientoSaldo "Libro mayor inmutable: Cada variacion contable genera un asiento auditable en CLP."
```
