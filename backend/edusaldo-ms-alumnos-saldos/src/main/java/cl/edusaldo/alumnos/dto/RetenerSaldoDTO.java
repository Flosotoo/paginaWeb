package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RetenerSaldoDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto a retener debe ser mayor a 0")
    private int monto;

    @NotNull(message = "El ID de la reserva es obligatorio")
    private Long reservaId;

    private Long usuarioId;

    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    private String referenciaUnica;

    public RetenerSaldoDTO() {}

    public RetenerSaldoDTO(Long alumnoId, int monto, Long reservaId) {
        this.alumnoId = alumnoId;
        this.monto = monto;
        this.reservaId = reservaId;
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }

    @JsonIgnore
    @Hidden
    public String getIdempotencyKey() { return referenciaUnica; }
    public void setIdempotencyKey(String idempotencyKey) { this.referenciaUnica = idempotencyKey; }
}
