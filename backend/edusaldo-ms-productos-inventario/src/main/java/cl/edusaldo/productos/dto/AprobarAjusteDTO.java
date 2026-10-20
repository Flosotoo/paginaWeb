package cl.edusaldo.productos.dto;

public class AprobarAjusteDTO {

    private Long administradorId;
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

    public Long getAutorizadorId() {
        return autorizadorId;
    }

    public void setAutorizadorId(Long autorizadorId) {
        this.autorizadorId = autorizadorId;
    }
}
