package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CobrarSaldoDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto a cobrar debe ser mayor a 0")
    private int monto;

    @NotNull(message = "El ID de la entrega es obligatorio")
    @JsonAlias({"referenciaId", "ventaId"})
    private Long entregaId;

    @JsonAlias({"veniaDeReserva", "esReserva"})
    private boolean vieneDeReserva = false;

    private String idempotencyKey;

    public CobrarSaldoDTO() {}

    public CobrarSaldoDTO(Long alumnoId, int monto, Long entregaId, boolean vieneDeReserva) {
        this.alumnoId = alumnoId;
        this.monto = monto;
        this.entregaId = entregaId;
        this.vieneDeReserva = vieneDeReserva;
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public Long getEntregaId() { return entregaId; }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }

    public boolean isVieneDeReserva() { return vieneDeReserva; }
    public void setVieneDeReserva(boolean vieneDeReserva) { this.vieneDeReserva = vieneDeReserva; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
