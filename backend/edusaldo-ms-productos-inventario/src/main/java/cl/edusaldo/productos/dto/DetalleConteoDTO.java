package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class DetalleConteoDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @Min(value = 0, message = "El stock contado no puede ser negativo")
    private int stockContado;

    public DetalleConteoDTO() {}

    public DetalleConteoDTO(Long productoId, int stockContado) {
        this.productoId = productoId;
        this.stockContado = stockContado;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public int getStockContado() { return stockContado; }
    public void setStockContado(int stockContado) { this.stockContado = stockContado; }
}
