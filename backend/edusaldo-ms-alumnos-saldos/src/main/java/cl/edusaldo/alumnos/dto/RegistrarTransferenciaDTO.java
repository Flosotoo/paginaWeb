package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

public class RegistrarTransferenciaDTO {

    private Long idEstablecimiento = 1L;

    @NotNull(message = "El ID del apoderado es obligatorio")
    private Long apoderadoId;

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @Positive(message = "El monto debe ser mayor a 0")
    private int monto;

    @NotNull(message = "La fecha de transferencia es obligatoria")
    private LocalDate fechaTransferencia = LocalDate.now();

    @NotBlank(message = "La URL o referencia del comprobante es obligatoria")
    private String comprobanteUrl;

    private String numeroOperacion;

    public RegistrarTransferenciaDTO() {}

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento; }
    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }
    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }
    public LocalDate getFechaTransferencia() { return fechaTransferencia; }
    public void setFechaTransferencia(LocalDate fechaTransferencia) { this.fechaTransferencia = fechaTransferencia; }
    public String getComprobanteUrl() { return comprobanteUrl; }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }
    public String getNumeroOperacion() { return numeroOperacion; }
    public void setNumeroOperacion(String numeroOperacion) { this.numeroOperacion = numeroOperacion; }
}
