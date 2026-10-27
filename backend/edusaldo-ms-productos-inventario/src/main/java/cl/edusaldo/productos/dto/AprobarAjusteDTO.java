package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;

public class AprobarAjusteDTO {

    @JsonAlias({"autorizadorId"})
    private Long administradorId;

    @JsonIgnore
    @Hidden
    private Long autorizadorId; // compatibilidad

    public AprobarAjusteDTO() {}

    public AprobarAjusteDTO(Long administradorId) {
        this.administradorId = administradorId;
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
}
