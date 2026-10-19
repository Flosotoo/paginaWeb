package cl.edusaldo.ventas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ItemDevolucionDTO {

    @NotNull(message = "El ID del detalle de entrega es obligatorio")
    private Long detalleEntregaId;

    @Min(value = 1, message = "La cantidad a devolver debe ser al menos 1")
    private int cantidad;

    public ItemDevolucionDTO() {}

    public Long getDetalleEntregaId() { return detalleEntregaId; }
    public void setDetalleEntregaId(Long detalleEntregaId) { this.detalleEntregaId = detalleEntregaId; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
}
