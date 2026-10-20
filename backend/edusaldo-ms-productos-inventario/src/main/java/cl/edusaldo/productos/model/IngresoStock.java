package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ingresos_stock")
public class IngresoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId;

    @Column(name = "proveedor", length = 150)
    private String proveedor;

    @Column(name = "documento_referencia", length = 100)
    private String documentoReferencia;

    @Column(name = "observacion", length = 500)
    private String observacion;

    @OneToMany(mappedBy = "ingresoStock", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleIngresoStock> detalles = new ArrayList<>();

    public IngresoStock() {}

    public IngresoStock(Long encargadoId, String proveedor, String documentoReferencia, String observacion) {
        this.encargadoId = encargadoId;
        this.proveedor = proveedor;
        this.documentoReferencia = documentoReferencia;
        this.observacion = observacion;
        this.fecha = LocalDateTime.now();
    }

    public void agregarDetalle(Producto producto, int cantidad) {
        DetalleIngresoStock detalle = new DetalleIngresoStock(this, producto, cantidad);
        this.detalles.add(detalle);
    }

    public void agregarDetalle(DetalleIngresoStock detalle) {
        detalle.setIngresoStock(this);
        this.detalles.add(detalle);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public String getProveedor() { return proveedor; }
    public void setProveedor(String proveedor) { this.proveedor = proveedor; }
    public String getDocumentoReferencia() { return documentoReferencia; }
    public void setDocumentoReferencia(String documentoReferencia) { this.documentoReferencia = documentoReferencia; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public List<DetalleIngresoStock> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleIngresoStock> detalles) { this.detalles = detalles; }
}
