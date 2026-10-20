package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "devoluciones", indexes = {
        @Index(name = "idx_devoluciones_establecimiento", columnList = "id_establecimiento"),
        @Index(name = "idx_devoluciones_alumno", columnList = "alumno_id")
})
public class Devolucion {

    private static final Logger log = LoggerFactory.getLogger(Devolucion.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "codigo_devolucion", nullable = false, unique = true, length = 50)
    private String codigoDevolucion;

    @Column(name = "entrega_id", nullable = false)
    private Long entregaId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_devolucion_entrega"))
    private Entrega entrega;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId; // Ref escalar a MS Alumnos

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "motivo", nullable = false)
    private String motivo;

    @Column(name = "total_reintegro", nullable = false)
    private int totalReintegro; // CLP en int

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId; // Ref escalar a MS Auth

    @OneToMany(mappedBy = "devolucion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleDevolucion> detalles = new ArrayList<>();

    public Devolucion() {
        this.idEstablecimiento = 1L;
    }

    public Devolucion(String codigoDevolucion, Long entregaId, Long alumnoId, String motivo, int totalReintegro, Long encargadoId) {
        this.idEstablecimiento = 1L;
        this.codigoDevolucion = codigoDevolucion;
        this.entregaId = entregaId;
        this.alumnoId = alumnoId;
        this.motivo = motivo;
        this.totalReintegro = totalReintegro;
        this.encargadoId = encargadoId;
        this.fecha = LocalDateTime.now();
    }

    public int calcularTotalReintegro() {
        this.totalReintegro = this.detalles.stream()
                .mapToInt(DetalleDevolucion::getMontoReintegro)
                .sum();
        return this.totalReintegro;
    }

    public void agregarDetalle(Long detalleEntregaId, Long productoId, String nombreProducto,
                               int cantidad, int precioUnitarioReintegro) {
        this.detalles.add(new DetalleDevolucion(this, detalleEntregaId, productoId, nombreProducto,
                cantidad, precioUnitarioReintegro));
    }

    public void registrar() {
        calcularTotalReintegro();
        log.info("[MS-DEVOLUCIONES] Registro de devolución {} por monto ${} CLP para entregaId={}",
                codigoDevolucion, totalReintegro, entregaId);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public String getCodigoDevolucion() { return codigoDevolucion; }
    public void setCodigoDevolucion(String codigoDevolucion) { this.codigoDevolucion = codigoDevolucion; }

    public Long getEntregaId() {
        if (entrega != null && entrega.getId() != null) {
            return entrega.getId();
        }
        return entregaId;
    }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }

    public Entrega getEntrega() { return entrega; }
    public void setEntrega(Entrega entrega) {
        this.entrega = entrega;
        if (entrega != null && entrega.getId() != null) {
            this.entregaId = entrega.getId();
        }
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public int getTotalReintegro() { return totalReintegro; }
    public void setTotalReintegro(int totalReintegro) { this.totalReintegro = totalReintegro; }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }

    public List<DetalleDevolucion> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleDevolucion> detalles) { this.detalles = detalles; }
}
