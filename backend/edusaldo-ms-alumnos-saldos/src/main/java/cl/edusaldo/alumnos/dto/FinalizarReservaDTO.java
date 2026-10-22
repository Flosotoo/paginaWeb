package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class FinalizarReservaDTO {

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser positivo")
    private int monto;

    @NotNull(message = "El ID de la reserva es obligatorio")
    private Long reservaId;

    @NotNull(message = "El ID de la venta es obligatorio")
    private Long ventaId;

    @NotNull(message = "El ID del usuario operador es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "La referencia única de operación es obligatoria")
    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    private String referenciaUnica;

    public FinalizarReservaDTO() {}

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public Long getVentaId() { return ventaId; }
    public void setVentaId(Long ventaId) { this.ventaId = ventaId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }

    @JsonIgnore
    @Hidden
    public String getIdempotencyKey() { return referenciaUnica; }
    public void setIdempotencyKey(String idempotencyKey) { this.referenciaUnica = idempotencyKey; }
}
