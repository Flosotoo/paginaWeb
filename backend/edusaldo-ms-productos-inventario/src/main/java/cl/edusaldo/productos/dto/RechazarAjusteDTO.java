package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.constraints.NotBlank;

public class RechazarAjusteDTO {

    @JsonAlias({"autorizadorId"})
    private Long administradorId;

    @JsonIgnore
    @Hidden
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

    @JsonIgnore
    @Hidden
    public Long getAutorizadorId() {
        return autorizadorId != null ? autorizadorId : administradorId;
    }

    @JsonIgnore
    @Hidden
    public void setAutorizadorId(Long autorizadorId) {
        this.autorizadorId = autorizadorId;
        if (this.administradorId == null) {
            this.administradorId = autorizadorId;
        }
    }

    public String getMotivoRechazo() {
        return motivoRechazo;
    }

    public void setMotivoRechazo(String motivoRechazo) {
        this.motivoRechazo = motivoRechazo;
    }
}
