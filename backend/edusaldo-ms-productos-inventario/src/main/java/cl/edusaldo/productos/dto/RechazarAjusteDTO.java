package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RechazarAjusteDTO {

    private Long administradorId;
    private Long autorizadorId; // compatibilidad

    @NotBlank(message = "El motivo de rechazo es obligatorio")
    private String motivoRechazo;

    public RechazarAjusteDTO() {}

    public RechazarAjusteDTO(Long administradorId, String motivoRechazo) {
        this.administradorId = administradorId;
        this.motivoRechazo = motivoRechazo;
    }

    public Long getAdministradorId() {
        return administradorId != null ? administradorId : autorizadorId;
    }

    public void setAdministradorId(Long administradorId) {
        this.administradorId = administradorId;
    }

    public Long getAutorizadorId() {
        return autorizadorId;
    }

    public void setAutorizadorId(Long autorizadorId) {
        this.autorizadorId = autorizadorId;
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
    }
}
