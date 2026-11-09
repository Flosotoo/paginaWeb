package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class ConfirmarAbonoDTO {
  @jakarta.validation.constraints.Pattern(regexp = "APROBADO|RECHAZADO")
  private String resultadoSimulado = "APROBADO";

  public String getResultadoSimulado() {
    return resultadoSimulado;
  }

  public void setResultadoSimulado(String value) {
    resultadoSimulado = value;
  }

  @NotBlank(message = "El token de transacción es obligatorio")
  @JsonAlias({"tokenTransaccion"})
  private String token;

  public ConfirmarAbonoDTO() {}

  public ConfirmarAbonoDTO(String token) {
    this.token = token;
  }

  public String getToken() {
    return token;
  }

  public void setToken(String token) {
    this.token = token;
  }
}
