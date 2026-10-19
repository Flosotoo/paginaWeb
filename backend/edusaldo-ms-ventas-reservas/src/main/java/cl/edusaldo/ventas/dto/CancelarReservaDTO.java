package cl.edusaldo.ventas.dto;

import jakarta.validation.constraints.NotBlank;

public class CancelarReservaDTO {

    @NotBlank(message = "El motivo de cancelación es obligatorio")
    private String motivo;

    private Long usuarioId;
    private Long encargadoId; // Fallback / alias si fue cancelada por encargado
    private String rol; // ENC, APO, ALU

    public CancelarReservaDTO() {}

    public CancelarReservaDTO(String motivo, Long usuarioId, String rol) {
        this.motivo = motivo;
        this.usuarioId = usuarioId;
        this.rol = rol;
    }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Long getUsuarioId() {
        if (this.usuarioId != null) {
            return this.usuarioId;
        }
        return this.encargadoId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
        if (this.encargadoId == null) {
            this.encargadoId = usuarioId;
        }
    }

    public Long getEncargadoId() { return getUsuarioId(); }
    public void setEncargadoId(Long encargadoId) {
        this.encargadoId = encargadoId;
        if (this.usuarioId == null) {
            this.usuarioId = encargadoId;
        }
    }

    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
}
