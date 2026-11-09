# Modelo de dominio · MS Productos e Inventario (8093 · db_inventario)

```mermaid
classDiagram
direction LR

class Categoria {
  +Long id
  +Long idEstablecimiento
  +String nombre
  +String descripcion
  +EstadoRegistro estado
}

class Producto {
  +Long id
  +Long idEstablecimiento
  +String sku
  +String nombre
  +String descripcion
  +String cursoNivel
  +int precio
  +int stockFisico
  +int stockReservado
  +int stockCritico
  +Long version
  +EstadoRegistro estado
}

class IngresoStock {
  +Long id
  +Long idEstablecimiento
  +Long encargadoId
  +LocalDateTime fecha
  +String referenciaUnica
  +String observacion
}

class DetalleIngresoStock {
  +Long id
  +int cantidad
}

class ReservaStock {
  +Long id
  +Long idEstablecimiento
  +Long reservaId
  +LocalDateTime fechaCreacion
  +String estado
}

class DetalleReservaStock {
  +Long id
  +int cantidad
}

class ConteoFisico {
  +Long id
  +Long idEstablecimiento
  +Long encargadoId
  +LocalDateTime fechaConteo
  +String observaciones
}

class DetalleConteoFisico {
  +Long id
  +int stockSistema
  +int stockContado
  +int diferencia
}

class SolicitudAjusteStock {
  +Long id
  +Long idEstablecimiento
  +Long encargadoId
  +Long administradorId
  +int cantidad
  +String motivo
  +EstadoSolicitud estado
  +LocalDateTime fechaSolicitud
  +LocalDateTime fechaResolucion
  +String motivoRechazo
}

class MovimientoInventario {
  +Long id
  +TipoMovimientoInventario tipo
  +int variacionFisica
  +int variacionReservada
  +int stockResultante
  +Long responsableId
  +Long entregaId
  +Long devolucionId
  +Long operacionCompensacionId
  +String referenciaUnica
  +LocalDateTime fecha
}

Categoria "1" <-- "0..*" Producto : clasifica

IngresoStock "1" *-- "1..*" DetalleIngresoStock : contiene
Producto "1" <-- "0..*" DetalleIngresoStock : corresponde

ReservaStock "1" *-- "1..*" DetalleReservaStock : contiene
Producto "1" <-- "0..*" DetalleReservaStock : compromete

ConteoFisico "1" *-- "1..*" DetalleConteoFisico : contiene
Producto "1" <-- "0..*" DetalleConteoFisico : contabiliza

Producto "1" <-- "0..*" SolicitudAjusteStock : recibe
Producto "1" -- "0..*" MovimientoInventario : historial

note for Producto "Invariante de Stock: stockDisponible = stockFisico - stockReservado >= 0."
note for ConteoFisico "El conteo registra diferencias fisicas (HU43) sin mutar automaticamente el stock fisico."
note for SolicitudAjusteStock "Segregacion de funciones (HU44 CA3): El Encargado solicita y el Administrador aprueba/rechaza (prohibida auto-aprobacion)."
note for MovimientoInventario "Kardex inmutable. Trazabilidad completa de ingresos, salidas, retenciones y ajustes."
```
