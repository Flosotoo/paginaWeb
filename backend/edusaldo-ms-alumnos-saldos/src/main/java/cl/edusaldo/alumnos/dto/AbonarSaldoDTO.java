package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class AbonarSaldoDTO {

    @NotNull(message = "El ID del apoderado es obligatorio")
    private Long apoderadoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto a abonar debe ser mayor a 0")
    private int monto;

    @NotBlank(message = "La llave de idempotencia es obligatoria")
    private String idempotencyKey;

    public AbonarSaldoDTO() {}

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
