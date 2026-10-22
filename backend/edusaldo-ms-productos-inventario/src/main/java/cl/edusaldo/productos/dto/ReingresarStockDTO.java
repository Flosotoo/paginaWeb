package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ReingresarStockDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @Positive(message = "La cantidad a reingresar debe ser mayor a 0")
    private int cantidad;

    @NotNull(message = "El ID de la devolución es obligatorio")
    private Long devolucionId;

    @JsonAlias({"responsableId"})
    private Long usuarioId = 2L;

    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    private String referenciaUnica;

    public ReingresarStockDTO() {}

    public ReingresarStockDTO(Long productoId, int cantidad, Long devolucionId, Long usuarioId) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.devolucionId = devolucionId;
        this.usuarioId = usuarioId;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public Long getDevolucionId() { return devolucionId; }
    public void setDevolucionId(Long devolucionId) { this.devolucionId = devolucionId; }
    public Long getUsuarioId() { return usuarioId != null ? usuarioId : 2L; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }
}
