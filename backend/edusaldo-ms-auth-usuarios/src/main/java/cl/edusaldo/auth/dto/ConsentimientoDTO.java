package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ConsentimientoDTO {

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "La versión del aviso es obligatoria")
    private String versionAviso;

    private String ipOrigen;

    public ConsentimientoDTO() {}

    public ConsentimientoDTO(Long usuarioId, String versionAviso, String ipOrigen) {
        this.usuarioId = usuarioId;
        this.versionAviso = versionAviso;
        this.ipOrigen = ipOrigen;
    }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getVersionAviso() { return versionAviso; }
    public void setVersionAviso(String versionAviso) { this.versionAviso = versionAviso; }
    public String getIpOrigen() { return ipOrigen; }
    public void setIpOrigen(String ipOrigen) { this.ipOrigen = ipOrigen; }
}
