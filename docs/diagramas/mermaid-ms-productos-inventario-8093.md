# Modelo de dominio · MS Productos e Inventario (8093 · db_inventario)

```mermaid
classDiagram
direction LR

class Categoria {
  +Long idCategoria
  +Long idEstablecimiento
  +String nombre
  +Boolean activa
  +modificar()
  +inactivar()
}

class Producto {
  +Long idProducto
  +Long idEstablecimiento
  +String sku
  +String nombre
  +String descripcion
  +String cursoNivel
  +int precioCLP
  +int stockFisico
  +int stockReservado
  +int umbralCritico
  +Long version
  +Boolean activo
  +disponible() int
  +esCritico() boolean
  +cambiarPrecio(nuevoPrecio)
  +inactivar()
}

class IngresoStock {
  +Long idIngreso
  +Long idEstablecimiento
  +Long encargadoId
  +DateTime fecha
  +String referenciaUnica
  +registrar()
}

class DetalleIngreso {
  +Long idDetalle
  +int cantidad
  +validarCantidad() boolean
}

class ReservaStock {
  +Long idReservaStock
  +Long idEstablecimiento
  +Long reservaId
  +EstadoReservaStock estado
  +comprometer()
  +liberar()
  +consumir()
}

class DetalleReservaStock {
  +Long idDetalle
  +int cantidad
}

class InventarioFisico {
  +Long idInventario
  +Long idEstablecimiento
  +Long encargadoId
  +DateTime fecha
  +finalizarConteo()
}

class DetalleConteo {
  +Long idDetalle
  +int cantidadContada
  +int cantidadSistema
  +diferencia() int
}

class SolicitudAjusteStock {
  +Long idSolicitud
  +Long idEstablecimiento
  +Long encargadoId
  +Long administradorId
  +int variacion
  +String motivo
  +EstadoAjuste estado
  +solicitar()
  +aprobar(adminId)
  +rechazar(adminId,motivo)
}

class MovimientoInventario {
  +Long idMovimiento
  +TipoMovimientoStock tipo
  +int variacionFisica
  +int variacionReservada
  +Long responsableId
  +String referenciaUnica
  +DateTime fecha
}

Categoria "1" <-- "0..*" Producto : clasifica

IngresoStock "1" *-- "1..*" DetalleIngreso : contiene
Producto "1" <-- "0..*" DetalleIngreso : corresponde

ReservaStock "1" *-- "1..*" DetalleReservaStock : contiene
Producto "1" <-- "0..*" DetalleReservaStock : compromete

InventarioFisico "1" *-- "1..*" DetalleConteo : contiene
Producto "1" <-- "0..*" DetalleConteo : contabiliza

Producto "1" <-- "0..*" SolicitudAjusteStock : recibe
Producto "1" -- "0..*" MovimientoInventario : historial
SolicitudAjusteStock "1" --> "0..1" MovimientoInventario : ajusteAprobado

note for Producto "Stock disponible = stock fisico - stock reservado. SKU unico por colegio."
note for ReservaStock "La reserva compromete stock, pero no disminuye el stock fisico."
note for SolicitudAjusteStock "El Encargado solicita y el Administrador aprueba o rechaza."
note for MovimientoInventario "Referencia unica evita movimientos duplicados por reintentos."
```