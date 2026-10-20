package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class IniciarAbonoDTO {

    @NotNull(message = "El ID del apoderado es obligatorio")
    private Long apoderadoId;

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto a abonar debe ser mayor a 0")
    private int monto;

    public IniciarAbonoDTO() {}

    public IniciarAbonoDTO(Long apoderadoId, Long alumnoId, int monto) {
        this.apoderadoId = apoderadoId;
        this.alumnoId = alumnoId;
        this.monto = monto;
    }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }
}
