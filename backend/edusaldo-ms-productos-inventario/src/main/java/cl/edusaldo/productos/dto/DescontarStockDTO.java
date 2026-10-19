package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class DescontarStockDTO {

    @NotNull(message = "El ID de producto es obligatorio")
    private Long productoId;

    @Min(value = 1, message = "La cantidad a descontar debe ser al menos 1")
    private int cantidad;

    private Long entregaId;
    private Long referenciaId;

    private boolean vieneDeReserva = true;

    @NotNull(message = "El ID de usuario es obligatorio")
    private Long usuarioId;

    private String idempotencyKey;

    public DescontarStockDTO() {}

    public DescontarStockDTO(Long productoId, int cantidad, Long entregaId, boolean vieneDeReserva, Long usuarioId) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.entregaId = entregaId;
        this.referenciaId = entregaId;
        this.vieneDeReserva = vieneDeReserva;
        this.usuarioId = usuarioId;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public Long getEntregaId() { return entregaId != null ? entregaId : referenciaId; }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }
    public Long getReferenciaId() { return referenciaId != null ? referenciaId : entregaId; }
    public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public boolean isVieneDeReserva() { return vieneDeReserva; }
    public void setVieneDeReserva(boolean vieneDeReserva) { this.vieneDeReserva = vieneDeReserva; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
