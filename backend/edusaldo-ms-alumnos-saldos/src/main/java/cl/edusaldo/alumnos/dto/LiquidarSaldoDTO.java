package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LiquidarSaldoDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @NotNull(message = "El ID del apoderado o tutor es obligatorio")
    @JsonAlias({"tutorId"})
    private Long apoderadoId;

    @NotBlank(message = "El medio de pago/devolución es obligatorio")
    private String medio;

    @NotBlank(message = "El comprobante es obligatorio")
    @JsonAlias({"comprobanteDevolucionUrl"})
    private String comprobante;

    @JsonIgnore
    @Hidden
    private String comprobanteDevolucionUrl;

    private Long administradorId = 1L;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    public LiquidarSaldoDTO() {}

    public LiquidarSaldoDTO(Long alumnoId, Long apoderadoId, String medio, String comprobante, String motivo) {
        this.alumnoId = alumnoId;
        this.apoderadoId = apoderadoId;
        this.medio = medio;
        this.comprobante = comprobante;
        this.motivo = motivo;
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public String getMedio() { return medio; }
    public void setMedio(String medio) { this.medio = medio; }

    public String getComprobante() { return comprobante != null ? comprobante : comprobanteDevolucionUrl; }
    public void setComprobante(String comprobante) { this.comprobante = comprobante; }

    @JsonIgnore
    @Hidden
    public String getComprobanteDevolucionUrl() { return comprobanteDevolucionUrl != null ? comprobanteDevolucionUrl : comprobante; }
    @JsonIgnore
    @Hidden
    public void setComprobanteDevolucionUrl(String comprobanteDevolucionUrl) { this.comprobanteDevolucionUrl = comprobanteDevolucionUrl; }

    public Long getAdministradorId() { return administradorId != null ? administradorId : 1L; }
    public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
