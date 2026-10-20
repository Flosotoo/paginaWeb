package cl.edusaldo.productos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class ConteoFisicoDTO {

    private Long idEstablecimiento = 1L;

    @NotNull(message = "El ID del encargado es obligatorio")
    private Long encargadoId;

    private String observaciones;

    @NotEmpty(message = "El conteo físico debe incluir al menos un producto")
    @Valid
    private List<DetalleConteoDTO> detalles;

    public ConteoFisicoDTO() {}

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<DetalleConteoDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleConteoDTO> detalles) { this.detalles = detalles; }
}
