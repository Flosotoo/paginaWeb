package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.EstadoSolicitud;
import cl.edusaldo.productos.model.SolicitudAjusteStock;
import java.time.LocalDateTime;

public class SolicitudAjusteResponseDTO {
    private Long id;
    private Long productoId;
    private String nombreProducto;
    private int cantidad;
    private String motivo;
    private Long encargadoId;
    private Long administradorId;
    private EstadoSolicitud estado;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaResolucion;
    private String motivoRechazo;

    public SolicitudAjusteResponseDTO() {}

    public SolicitudAjusteResponseDTO(SolicitudAjusteStock s) {
        this.id = s.getId();
        if (s.getProducto() != null) {
            this.productoId = s.getProducto().getId();
            this.nombreProducto = s.getProducto().getNombre();
        }
        this.cantidad = s.getCantidad();
        this.motivo = s.getMotivo();
        this.encargadoId = s.getEncargadoId();
        this.administradorId = s.getAdministradorId();
        this.estado = s.getEstado();
        this.fechaSolicitud = s.getFechaSolicitud();
        this.fechaResolucion = s.getFechaResolucion();
        this.motivoRechazo = s.getMotivoRechazo();
    }

    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getNombreProducto() { return nombreProducto; }
    public int getCantidad() { return cantidad; }
    public String getMotivo() { return motivo; }
    public Long getEncargadoId() { return encargadoId; }
    public Long getAdministradorId() { return administradorId; }
    public EstadoSolicitud getEstado() { return estado; }
    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public String getMotivoRechazo() { return motivoRechazo; }
}
