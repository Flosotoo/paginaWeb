package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "conteos_fisicos")
public class ConteoFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId;

    @Column(name = "fecha_conteo", nullable = false)
    private LocalDateTime fechaConteo = LocalDateTime.now();

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @OneToMany(mappedBy = "conteoFisico", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleConteoFisico> detalles = new ArrayList<>();

    public ConteoFisico() {
        this.idEstablecimiento = 1L;
    }

    public ConteoFisico(Long encargadoId, String observaciones) {
        this.idEstablecimiento = 1L;
        this.encargadoId = encargadoId;
        this.observaciones = observaciones;
        this.fechaConteo = LocalDateTime.now();
    }

    public void agregarDetalle(Producto producto, int stockContado) {
        int stockSistema = producto != null ? producto.getStockFisico() : 0;
        DetalleConteoFisico det = new DetalleConteoFisico(this, producto, stockSistema, stockContado);
        this.detalles.add(det);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
    public LocalDateTime getFechaConteo() { return fechaConteo; }
    public void setFechaConteo(LocalDateTime fechaConteo) { this.fechaConteo = fechaConteo; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public List<DetalleConteoFisico> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleConteoFisico> detalles) { this.detalles = detalles; }
}
