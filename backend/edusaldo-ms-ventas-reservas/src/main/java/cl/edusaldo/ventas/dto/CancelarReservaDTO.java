package cl.edusaldo.ventas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelarReservaDTO {
  @NotBlank @Size(max = 255) private String motivo;

  public CancelarReservaDTO() {}

  public String getMotivo() {
    return motivo;
  }

  public void setMotivo(String motivo) {
    this.motivo = motivo;
  }

}
