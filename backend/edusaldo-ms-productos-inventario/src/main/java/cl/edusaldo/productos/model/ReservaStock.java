package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservas_stock")
public class ReservaStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "reserva_id", nullable = false, unique = true)
    private Long reservaId;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "COMPROMETIDA";

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @OneToMany(mappedBy = "reservaStock", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleReservaStock> detalles = new ArrayList<>();

    public ReservaStock() {
        this.idEstablecimiento = 1L;
    }

    public ReservaStock(Long reservaId) {
        this.idEstablecimiento = 1L;
        this.reservaId = reservaId;
        this.estado = "COMPROMETIDA";
        this.fechaCreacion = LocalDateTime.now();
    }

    public void agregarDetalle(Producto producto, int cantidad) {
        this.detalles.add(new DetalleReservaStock(this, producto, cantidad));
    }

    public void comprometer() {
        this.estado = "COMPROMETIDA";
    }

    public void liberar() {
        this.estado = "LIBERADA";
    }

    public void consumir() {
        this.estado = "CONSUMIDA";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }
    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public List<DetalleReservaStock> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleReservaStock> detalles) { this.detalles = detalles; }
}
