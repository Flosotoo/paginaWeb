package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class DetalleIngresoDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private int cantidad;

    public DetalleIngresoDTO() {}

    public DetalleIngresoDTO(Long productoId, int cantidad) {
        this.productoId = productoId;
        this.cantidad = cantidad;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
}
