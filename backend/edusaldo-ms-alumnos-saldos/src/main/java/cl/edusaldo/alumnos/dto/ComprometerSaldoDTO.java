package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ComprometerSaldoDTO {

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser positivo")
    private int monto;

    @NotNull(message = "El ID de la reserva es obligatorio")
    private Long reservaId;

    @NotNull(message = "El ID del usuario operador es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "La llave de idempotencia es obligatoria")
    private String idempotencyKey;

    public ComprometerSaldoDTO() {}

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
