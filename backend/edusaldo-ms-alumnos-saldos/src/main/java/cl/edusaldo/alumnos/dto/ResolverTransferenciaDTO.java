package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotNull;

public class ResolverTransferenciaDTO {

    @NotNull(message = "El ID del apoderado revisor del Centro de Padres es obligatorio")
    private Long revisorApoderadoId;

    @NotNull(message = "Debe indicar si aprueba o rechaza la transferencia")
    private Boolean aprobar;

    private String motivoRechazo;

    public ResolverTransferenciaDTO() {}

    public Long getRevisorApoderadoId() { return revisorApoderadoId; }
    public void setRevisadoPorApoderadoId(Long revisorApoderadoId) { this.revisorApoderadoId = revisorApoderadoId; }
    public void setRevisorApoderadoId(Long revisorApoderadoId) { this.revisorApoderadoId = revisorApoderadoId; }
    public Boolean getAprobar() { return aprobar; }
    public void setAprobar(Boolean aprobar) { this.aprobar = aprobar; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
}
