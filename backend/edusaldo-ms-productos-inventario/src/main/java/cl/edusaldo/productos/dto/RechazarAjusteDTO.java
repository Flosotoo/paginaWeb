package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.NotBlank;

public class RechazarAjusteDTO {
  private Long administradorId;
  @NotBlank(message = "El motivo de rechazo es obligatorio")
  private String motivoRechazo;

  public RechazarAjusteDTO() {}
  public RechazarAjusteDTO(Long administradorId, String motivoRechazo) {
    this.administradorId = administradorId;
    this.motivoRechazo = motivoRechazo;
  }
  public Long getAdministradorId() { return administradorId; }
  public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }
  public String getMotivoRechazo() { return motivoRechazo; }
  public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }
}
