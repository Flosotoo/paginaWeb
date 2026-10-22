package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class AbonarSaldoDTO {

    @NotNull(message = "El ID del apoderado es obligatorio")
    private Long apoderadoId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto a abonar debe ser mayor a 0")
    private int monto;

    @NotBlank(message = "La referencia única de operación es obligatoria")
    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    private String referenciaUnica;

    public AbonarSaldoDTO() {}

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }

    @JsonIgnore
    @Hidden
    public String getIdempotencyKey() { return referenciaUnica; }
    public void setIdempotencyKey(String idempotencyKey) { this.referenciaUnica = idempotencyKey; }
}
