package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SolicitudCorreccionDTO {

    private Long idEstablecimiento = 1L;

    @NotNull(message = "El ID del usuario es obligatorio")
    private Long usuarioId;

    @NotBlank(message = "El campo solicitado es obligatorio")
    private String campoSolicitado;

    private String valorActual;

    @NotBlank(message = "El valor propuesto es obligatorio")
    private String valorPropuesto;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;

    public SolicitudCorreccionDTO() {}

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getCampoSolicitado() { return campoSolicitado; }
    public void setCampoSolicitado(String campoSolicitado) { this.campoSolicitado = campoSolicitado; }
    public String getValorActual() { return valorActual; }
    public void setValorActual(String valorActual) { this.valorActual = valorActual; }
    public String getValorPropuesto() { return valorPropuesto; }
    public void setValorPropuesto(String valorPropuesto) { this.valorPropuesto = valorPropuesto; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
