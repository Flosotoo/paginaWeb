# Modelo de dominio · MS Saldos y Abonos (8092 · db_saldos)

```mermaid
classDiagram
direction LR

class CuentaSaldo {
  +Long idCuenta
  +Long alumnoId
  +Long idEstablecimiento
  +int saldoActualCLP
  +int saldoComprometidoCLP
  +Long version
  +disponible() int
  +acreditar(monto,claveOperacion)
  +comprometer(reservaId,monto)
  +liberar(reservaId)
  +consumir(reservaId,entregaId)
  +reintegrar(devolucionId,monto)
}

class Abono {
  +Long idAbono
  +Long apoderadoId
  +int montoCLP
  +MedioPago medio
  +EstadoAbono estado
  +DateTime fechaSolicitud
  +String claveOperacion
  +aprobar()
  +rechazar(motivo)
  +estaPendiente() boolean
}

class PagoWebpaySimulado {
  +Long idPago
  +String referenciaPago
  +String resultado
  +DateTime fechaResultado
  +registrarResultado()
}

class TransferenciaBancaria {
  +Long idTransferencia
  +Date fechaTransferencia
  +String comprobanteUrl
  +Long revisadoPorApoderadoId
  +DateTime fechaRevision
  +String motivoRechazo
  +aprobar(revisorId)
  +rechazar(revisorId,motivo)
}

class CompromisoSaldo {
  +Long idCompromiso
  +Long reservaId
  +int montoCLP
  +EstadoCompromiso estado
  +comprometer()
  +liberar()
  +consumir()
}

class MovimientoSaldo {
  +Long idMovimiento
  +TipoMovimiento tipo
  +int montoCLP
  +int saldoResultanteCLP
  +String referenciaUnica
  +DateTime fecha
}

class ConstanciaDevolucionSaldo {
  +Long idConstancia
  +Long administradorId
  +int montoCLP
  +Date fechaEntregaDinero
  +String referencia
  +registrarSalida()
}

class AlertaSaldoBajo {
  +Long idAlerta
  +int umbralAplicadoCLP
  +Boolean activa
  +DateTime fechaUltimoAviso
  +evaluar(saldoDisponible)
  +reactivar()
}

class NotificacionSaldoPendiente {
  +Long idNotificacion
  +Long alumnoId
  +String claveEvento
  +EstadoEnvio estado
  +int intentos
  +DateTime siguienteIntento
  +marcarEnviada()
  +programarReintento()
}

CuentaSaldo "1" *-- "0..*" Abono : recibe
CuentaSaldo "1" *-- "0..*" MovimientoSaldo : registra
CuentaSaldo "1" *-- "0..*" CompromisoSaldo : mantiene
CuentaSaldo "1" *-- "0..*" ConstanciaDevolucionSaldo : documenta
CuentaSaldo "1" *-- "0..*" AlertaSaldoBajo : controla

Abono "1" *-- "0..1" PagoWebpaySimulado : pagoWebpay
Abono "1" *-- "0..1" TransferenciaBancaria : transferencia
Abono "1" --> "0..1" MovimientoSaldo : acredita

ConstanciaDevolucionSaldo "1" --> "1" MovimientoSaldo : genera
AlertaSaldoBajo "1" --> "0..*" NotificacionSaldoPendiente : genera

note for CuentaSaldo "Disponible = actual - comprometido. No puede ser negativo. Version protege concurrencia."
note for Abono "Se utiliza una sola modalidad de pago. No vence automaticamente."
note for MovimientoSaldo "Referencia unica para evitar aplicar dos veces la misma operacion."
note for TransferenciaBancaria "Solo un apoderado autorizado del Centro de Padres puede aprobar o rechazar."
```