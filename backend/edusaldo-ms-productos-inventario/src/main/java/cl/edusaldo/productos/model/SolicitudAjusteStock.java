package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudes_ajuste_stock")
public class SolicitudAjusteStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud = LocalDateTime.now();

    @Column(name = "administrador_id")
    private Long administradorId;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @Column(name = "motivo_rechazo", length = 500)
    private String motivoRechazo;

    public SolicitudAjusteStock() {}

    public SolicitudAjusteStock(Producto producto, int cantidad, String motivo, Long encargadoId) {
        this.producto = producto;
        this.cantidad = cantidad;
        this.motivo = motivo;
        this.encargadoId = encargadoId;
        this.estado = EstadoSolicitud.PENDIENTE;
        this.fechaSolicitud = LocalDateTime.now();
    }

    public void aprobar(Long adminId) {
        if (this.estado != EstadoSolicitud.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden aprobar solicitudes en estado PENDIENTE.");
        }
        this.estado = EstadoSolicitud.APROBADA;
        this.administradorId = adminId;
        this.fechaResolucion = LocalDateTime.now();
    }

    public void rechazar(Long adminId, String motivoRechazo) {
        if (this.estado != EstadoSolicitud.PENDIENTE) {
            throw new IllegalStateException("Solo se pueden rechazar solicitudes en estado PENDIENTE.");
        }
        this.estado = EstadoSolicitud.RECHAZADA;
        this.administradorId = adminId;
        this.motivoRechazo = motivoRechazo;
        this.fechaResolucion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public EstadoSolicitud getEstado() { return estado; }
    public void setEstado(EstadoSolicitud estado) { this.estado = estado; }
    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
    public Long getAdministradorId() { return administradorId; }
    public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }
    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }
    public String getMotivoRechazo() { return motivoRechazo; }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }

    public Long getProductoId() {
        return producto != null ? producto.getId() : null;
    }
}
