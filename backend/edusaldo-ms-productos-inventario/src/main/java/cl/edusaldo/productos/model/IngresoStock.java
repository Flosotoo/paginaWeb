package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ingresos_stock")
public class IngresoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId;

    @Column(name = "referencia_unica", nullable = false, unique = true, length = 100)
    private String referenciaUnica;

    @Column(name = "observacion", length = 500)
    private String observacion;

    @OneToMany(mappedBy = "ingresoStock", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleIngresoStock> detalles = new ArrayList<>();

    public IngresoStock() {
        this.idEstablecimiento = 1L;
        this.referenciaUnica = "ING-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    public IngresoStock(Long encargadoId, String referenciaUnica, String observacion) {
        this.idEstablecimiento = 1L;
        this.encargadoId = encargadoId;
        this.referenciaUnica = (referenciaUnica != null && !referenciaUnica.isBlank())
                ? referenciaUnica
                : "ING-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        this.observacion = observacion;
        this.fecha = LocalDateTime.now();
    }

    public IngresoStock(Long encargadoId, String ignored1, String referenciaUnica, String observacion) {
        this(encargadoId, referenciaUnica, observacion);
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
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }
    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
    public List<DetalleIngresoStock> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleIngresoStock> detalles) { this.detalles = detalles; }
}
