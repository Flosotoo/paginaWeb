package cl.edusaldo.alumnos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public class LiquidarSaldoDTO {
  @NotNull @Positive private Long alumnoId;
  @NotNull @Positive private Long apoderadoId;
  @NotBlank @Size(max = 50) private String medio;
  @NotBlank @Size(max = 100) private String comprobante;
  @NotBlank @Size(max = 255) private String motivo;

  public LiquidarSaldoDTO() {}
  public LiquidarSaldoDTO(Long alumnoId, Long apoderadoId, String medio, String comprobante, String motivo) {
    this.alumnoId = alumnoId; this.apoderadoId = apoderadoId; this.medio = medio; this.comprobante = comprobante; this.motivo = motivo;
  }
  public Long getAlumnoId() { return alumnoId; }
  public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
  public Long getApoderadoId() { return apoderadoId; }
  public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }
  public String getMedio() { return medio; }
  public void setMedio(String medio) { this.medio = medio; }
  public String getComprobante() { return comprobante; }
  public void setComprobante(String comprobante) { this.comprobante = comprobante; }
  public String getMotivo() { return motivo; }
  public void setMotivo(String motivo) { this.motivo = motivo; }
}
