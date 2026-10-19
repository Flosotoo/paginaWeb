package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.IngresoStock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class IngresoStockResponseDTO {
    private Long id;
    private LocalDateTime fecha;
    private Long encargadoId;
    private String proveedor;
    private String documentoReferencia;
    private String observacion;
    private List<DetalleIngresoResponseDTO> detalles;

    public IngresoStockResponseDTO() {}

    public IngresoStockResponseDTO(IngresoStock ingreso) {
        this.id = ingreso.getId();
        this.fecha = ingreso.getFecha();
        this.encargadoId = ingreso.getEncargadoId();
        this.proveedor = ingreso.getProveedor();
        this.documentoReferencia = ingreso.getDocumentoReferencia();
        this.observacion = ingreso.getObservacion();
        if (ingreso.getDetalles() != null) {
            this.detalles = ingreso.getDetalles().stream()
                    .map(DetalleIngresoResponseDTO::new)
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public LocalDateTime getFecha() { return fecha; }
    public Long getEncargadoId() { return encargadoId; }
    public String getProveedor() { return proveedor; }
    public String getDocumentoReferencia() { return documentoReferencia; }
    public String getObservacion() { return observacion; }
    public List<DetalleIngresoResponseDTO> getDetalles() { return detalles; }
}
