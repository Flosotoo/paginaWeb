package cl.edusaldo.ventas.model;

import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "devoluciones")
public class Devolucion {

    private static final Logger log = LoggerFactory.getLogger(Devolucion.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo_devolucion", nullable = false, unique = true, length = 50)
    private String codigoDevolucion;

    @Column(name = "entrega_id", nullable = false)
    private Long entregaId; // Ref escalar a Entrega

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

    public Devolucion() {}

    public Devolucion(String codigoDevolucion, Long entregaId, Long alumnoId, String motivo, int totalReintegro, Long encargadoId) {
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

    public String getCodigoDevolucion() { return codigoDevolucion; }
    public void setCodigoDevolucion(String codigoDevolucion) { this.codigoDevolucion = codigoDevolucion; }

    public Long getEntregaId() { return entregaId; }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }

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
