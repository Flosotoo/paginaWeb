package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Positive;

public class ReintegrarSaldoDTO {

  @NotNull @Positive private Long entregaId;

  public Long getEntregaId() {
    return entregaId;
  }

  public void setEntregaId(Long value) {
    this.entregaId = value;
  }

  @NotNull(message = "El ID del alumno es obligatorio")
  @Positive
  private Long alumnoId;

  @Positive(message = "El monto a reintegrar debe ser mayor a 0")
  private int monto;

  @Positive private Long devolucionId;

  @Positive private Long operacionCompensacionId;

  @JsonProperty("referenciaUnica")
  @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
  @Schema(
      description = "Referencia o código único de la operación para evitar registros duplicados")
  private String referenciaUnica;

  public ReintegrarSaldoDTO() {}

  public ReintegrarSaldoDTO(Long alumnoId, int monto, Long devolucionId, String referenciaUnica) {
    this.alumnoId = alumnoId;
    this.monto = monto;
    this.devolucionId = devolucionId;
    this.referenciaUnica = referenciaUnica;
  }

  public Long getAlumnoId() {
    return alumnoId;
  }

  public void setAlumnoId(Long alumnoId) {
    this.alumnoId = alumnoId;
  }

  public int getMonto() {
    return monto;
  }

  public void setMonto(int monto) {
    this.monto = monto;
  }

  public Long getDevolucionId() {
    return devolucionId;
  }

  public void setDevolucionId(Long devolucionId) {
    this.devolucionId = devolucionId;
  }

  public Long getOperacionCompensacionId() {
    return operacionCompensacionId;
  }

  public void setOperacionCompensacionId(Long operacionCompensacionId) {
    this.operacionCompensacionId = operacionCompensacionId;
  }

  @JsonIgnore
  @AssertTrue(message = "Debe indicarse una devolución o una compensación, exclusivamente")
  public boolean isOrigenValido() {
    return (devolucionId != null) != (operacionCompensacionId != null);
  }

  public String getReferenciaUnica() {
    return referenciaUnica;
  }

  public void setReferenciaUnica(String referenciaUnica) {
    this.referenciaUnica = referenciaUnica;
  }

  @JsonIgnore
  @Hidden
  public String getIdempotencyKey() {
    return referenciaUnica;
  }

  public void setIdempotencyKey(String idempotencyKey) {
    this.referenciaUnica = idempotencyKey;
  }
}
