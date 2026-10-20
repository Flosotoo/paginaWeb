package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ReintegrarSaldoDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @Positive(message = "El monto a reintegrar debe ser mayor a 0")
    private int monto;

    @NotNull(message = "El ID de la devolución es obligatorio")
    private Long devolucionId;

    private String idempotencyKey;

    public ReintegrarSaldoDTO() {}

    public ReintegrarSaldoDTO(Long alumnoId, int monto, Long devolucionId, String idempotencyKey) {
        this.alumnoId = alumnoId;
        this.monto = monto;
        this.devolucionId = devolucionId;
        this.idempotencyKey = idempotencyKey;
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }
    public Long getDevolucionId() { return devolucionId; }
    public void setDevolucionId(Long devolucionId) { this.devolucionId = devolucionId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
