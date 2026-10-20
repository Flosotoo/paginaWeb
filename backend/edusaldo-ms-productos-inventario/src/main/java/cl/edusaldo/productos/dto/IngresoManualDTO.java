package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class IngresoManualDTO {

    @NotNull(message = "El ID del encargado es obligatorio")
    private Long encargadoId;

    private String referenciaUnica;
    private String observacion;

    @NotEmpty(message = "Debe incluir al menos un detalle de producto")
    @Valid
    private List<DetalleIngresoDTO> detalles;

    public IngresoManualDTO() {}

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public List<DetalleIngresoDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleIngresoDTO> detalles) { this.detalles = detalles; }

    // Setters de compatibilidad para tests legacy (HU42 CA3: ignorados en persistencia)
    @JsonIgnore
    public void setProveedor(String ignored) {}
    @JsonIgnore
    public void setDocumentoReferencia(String doc) {
        if (this.referenciaUnica == null) {
            this.referenciaUnica = doc;
        }
    }
}
