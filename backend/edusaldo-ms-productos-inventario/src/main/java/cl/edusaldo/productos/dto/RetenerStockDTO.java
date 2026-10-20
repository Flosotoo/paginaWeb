package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class RetenerStockDTO {

    @NotNull(message = "El ID de producto es obligatorio")
    private Long productoId;

    @Min(value = 1, message = "La cantidad a retener debe ser al menos 1")
    private int cantidad;

    private Long reservaId;
    private Long referenciaId;

    @NotNull(message = "El ID de usuario es obligatorio")
    private Long usuarioId;

    private String idempotencyKey;

    public RetenerStockDTO() {}

    public RetenerStockDTO(Long productoId, int cantidad, Long reservaId, Long usuarioId) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.reservaId = reservaId;
        this.referenciaId = reservaId;
        this.usuarioId = usuarioId;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public Long getReservaId() { return reservaId != null ? reservaId : referenciaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }
    public Long getReferenciaId() { return referenciaId != null ? referenciaId : reservaId; }
    public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
