package cl.edusaldo.productos.dto;

public class AprobarAjusteDTO {
  private Long administradorId;

  public AprobarAjusteDTO() {}
  public AprobarAjusteDTO(Long administradorId) { this.administradorId = administradorId; }
  public Long getAdministradorId() { return administradorId; }
  public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }
}
