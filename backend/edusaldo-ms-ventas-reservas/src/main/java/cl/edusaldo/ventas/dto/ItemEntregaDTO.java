package cl.edusaldo.ventas.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class ItemEntregaDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    private String nombreProducto;

    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private int cantidad;

    private Integer precioUnitario; // CLP en int

    public ItemEntregaDTO() {}

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }

    public Integer getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Integer precioUnitario) { this.precioUnitario = precioUnitario; }
}
