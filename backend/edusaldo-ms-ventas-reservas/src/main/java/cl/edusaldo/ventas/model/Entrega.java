package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "entregas", indexes = {
        @Index(name = "idx_entregas_establecimiento", columnList = "id_establecimiento"),
        @Index(name = "idx_entregas_alumno", columnList = "alumno_id")
})
public class Entrega {

    private static final Logger log = LoggerFactory.getLogger(Entrega.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "numero", nullable = false, unique = true, length = 50)
    private String numero;

    @Column(name = "reserva_id")
    private Long reservaId; // Opcional si el origen es RESERVA

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_entrega_reserva"))
    private Reserva reserva;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId; // Ref escalar a MS Alumnos

    @Enumerated(EnumType.STRING)
    @Column(name = "origen", nullable = false, length = 20)
    private OrigenEntrega origen;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "total", nullable = false)
    private int total; // CLP en int

    @Column(name = "encargado_id", nullable = false)
    private Long encargadoId; // Ref escalar a MS Auth

    @OneToMany(mappedBy = "entrega", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleEntrega> detalles = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "entrega", fetch = FetchType.LAZY)
    private List<Devolucion> devoluciones = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "entrega", fetch = FetchType.LAZY)
    private List<NotificacionPendiente> notificaciones = new ArrayList<>();

    public Entrega() {
        this.idEstablecimiento = 1L;
    }

    public Entrega(String numero, Long reservaId, Long alumnoId, OrigenEntrega origen, int total, Long encargadoId) {
        this.idEstablecimiento = 1L;
        this.numero = numero;
        this.reservaId = reservaId;
        this.alumnoId = alumnoId;
        this.origen = origen;
        this.total = total;
        this.encargadoId = encargadoId;
        this.fecha = LocalDateTime.now();
    }

    public int calcularTotal() {
        this.total = this.detalles.stream()
                .mapToInt(DetalleEntrega::getSubtotal)
                .sum();
        return this.total;
    }

    public void agregarDetalle(Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
        this.detalles.add(new DetalleEntrega(this, productoId, nombreProducto, cantidad, precioUnitario));
    }

    public static Entrega registrarEnMeson(Long alumnoId, Long encargadoId, List<DetalleEntrega> items) {
        String numero = "ENT-MES-" + System.currentTimeMillis();
        Entrega entrega = new Entrega(numero, null, alumnoId, OrigenEntrega.MESON, 0, encargadoId);
        if (items != null) {
            for (DetalleEntrega item : items) {
                item.setEntrega(entrega);
                entrega.getDetalles().add(item);
            }
        }
        entrega.calcularTotal();
        entrega.cobrarSaldoEnMsSaldos();
        entrega.descontarStockEnMsInventario();
        entrega.notificarApoderadosPorCorreo();
        return entrega;
    }

    public void cobrarSaldoEnMsSaldos() {
        log.info("[MS-ENTREGAS] Orquestación conceptual: cobro de ${} CLP en MS Saldos para alumnoId={}", total, alumnoId);
    }

    public void descontarStockEnMsInventario() {
        log.info("[MS-ENTREGAS] Orquestación conceptual: descuento de stock en MS Inventario para entrega={}", numero);
    }

    public void notificarApoderadosPorCorreo() {
        log.info("[MS-ENTREGAS] Notificación por correo enviada a apoderados del alumnoId={} por entrega de materiales {}", alumnoId, numero);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public Long getReservaId() {
        if (reserva != null && reserva.getId() != null) {
            return reserva.getId();
        }
        return reservaId;
    }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public Reserva getReserva() { return reserva; }
    public void setReserva(Reserva reserva) {
        this.reserva = reserva;
        if (reserva != null && reserva.getId() != null) {
            this.reservaId = reserva.getId();
        }
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public OrigenEntrega getOrigen() { return origen; }
    public void setOrigen(OrigenEntrega origen) { this.origen = origen; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }

    public List<DetalleEntrega> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleEntrega> detalles) { this.detalles = detalles; }

    public List<Devolucion> getDevoluciones() { return devoluciones; }
    public void setDevoluciones(List<Devolucion> devoluciones) { this.devoluciones = devoluciones; }

    public List<NotificacionPendiente> getNotificaciones() { return notificaciones; }
    public void setNotificaciones(List<NotificacionPendiente> notificaciones) { this.notificaciones = notificaciones; }
}
