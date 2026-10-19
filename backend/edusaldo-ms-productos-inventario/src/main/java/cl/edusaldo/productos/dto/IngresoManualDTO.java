package cl.edusaldo.productos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class IngresoManualDTO {

    @NotNull(message = "El ID del encargado es obligatorio")
    private Long encargadoId;

    private String proveedor;
    private String documentoReferencia;
    private String observacion;

    @NotEmpty(message = "Debe incluir al menos un detalle de producto")
    @Valid
    private List<DetalleIngresoDTO> detalles;

    public IngresoManualDTO() {}

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public String getProveedor() { return proveedor; }
    public void setProveedor(String proveedor) { this.proveedor = proveedor; }
    public String getDocumentoReferencia() { return documentoReferencia; }
    public void setDocumentoReferencia(String documentoReferencia) { this.documentoReferencia = documentoReferencia; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public List<DetalleIngresoDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleIngresoDTO> detalles) { this.detalles = detalles; }
}
