package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class LiberarStockDTO {

    @NotNull(message = "El ID de producto es obligatorio")
    private Long productoId;

    @Min(value = 1, message = "La cantidad a liberar debe ser al menos 1")
    private int cantidad;

    @JsonAlias({"referenciaId"})
    private Long reservaId;
    @JsonIgnore
    @Hidden
    private Long referenciaId;

    @NotNull(message = "El ID de usuario es obligatorio")
    @JsonAlias({"responsableId"})
    private Long usuarioId;

    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    private String referenciaUnica;

    public LiberarStockDTO() {}

    public LiberarStockDTO(Long productoId, int cantidad, Long reservaId, Long usuarioId) {
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
    @JsonIgnore
    @Hidden
    public Long getReferenciaId() { return getReservaId(); }
    @JsonIgnore
    @Hidden
    public void setReferenciaId(Long referenciaId) {
        this.referenciaId = referenciaId;
        if (this.reservaId == null) {
            this.reservaId = referenciaId;
        }
    }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }
}
