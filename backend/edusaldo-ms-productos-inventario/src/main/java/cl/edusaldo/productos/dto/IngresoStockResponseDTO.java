package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.IngresoStock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class IngresoStockResponseDTO {
    private Long id;
    private Long idEstablecimiento;
    private LocalDateTime fecha;
    private Long encargadoId;
    private String referenciaUnica;
    private String observacion;
    private List<DetalleIngresoResponseDTO> detalles;

    public IngresoStockResponseDTO() {}

    public IngresoStockResponseDTO(IngresoStock ingreso) {
        this.id = ingreso.getId();
        this.idEstablecimiento = ingreso.getIdEstablecimiento();
        this.fecha = ingreso.getFecha();
        this.encargadoId = ingreso.getEncargadoId();
        this.referenciaUnica = ingreso.getReferenciaUnica();
        this.observacion = ingreso.getObservacion();
        if (ingreso.getDetalles() != null) {
            this.detalles = ingreso.getDetalles().stream()
                    .map(DetalleIngresoResponseDTO::new)
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public Long getIdEstablecimiento() { return idEstablecimiento; }
    public LocalDateTime getFecha() { return fecha; }
    public Long getEncargadoId() { return encargadoId; }
    public String getReferenciaUnica() { return referenciaUnica; }
    public String getObservacion() { return observacion; }
    public List<DetalleIngresoResponseDTO> getDetalles() { return detalles; }
}
