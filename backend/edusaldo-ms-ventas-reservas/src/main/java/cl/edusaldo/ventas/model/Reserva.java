package cl.edusaldo.ventas.model;

import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservas")
public class Reserva {

    private static final Logger log = LoggerFactory.getLogger(Reserva.class);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId; // Ref escalar a MS Alumnos

    @Column(name = "creada_por_id", nullable = false)
    private Long creadaPorId; // Ref escalar a MS Auth (Apoderado o Alumno >= 12 años)

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "total", nullable = false)
    private int total; // CLP en int

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoReserva estado = EstadoReserva.PENDIENTE;

    @Column(name = "motivo_cancelacion")
    private String motivoCancelacion;

    @Column(name = "cancelada_por_id")
    private Long canceladaPorId;

    @Column(name = "preparada_por_id")
    private Long preparadaPorId; // HU31 CA2: Encargado que preparó el pedido

    @Column(name = "fecha_preparacion")
    private LocalDateTime fechaPreparacion; // HU31 CA2: Marca de tiempo de preparación

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleReserva> detalles = new ArrayList<>();

    public Reserva() {}

    public Reserva(String codigo, Long alumnoId, Long creadaPorId, int total) {
        this.codigo = codigo;
        this.alumnoId = alumnoId;
        this.creadaPorId = creadaPorId;
        this.total = total;
        this.estado = EstadoReserva.PENDIENTE;
        this.fechaCreacion = LocalDateTime.now();
    }

    public void agregarDetalle(Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
        this.detalles.add(new DetalleReserva(this, productoId, nombreProducto, cantidad, precioUnitario));
    }

    public int calcularTotal() {
        this.total = this.detalles.stream()
                .mapToInt(DetalleReserva::getSubtotal)
                .sum();
        return this.total;
    }

    public void confirmar() {
        if (this.detalles.isEmpty()) {
            throw new IllegalStateException("La reserva debe contener al menos un material.");
        }
        calcularTotal();
        this.estado = EstadoReserva.PENDIENTE;
    }

    /**
     * HU31 CA2: Preparación de reserva en mesón. Registra mandatoriamente
     * preparadaPorId y fechaPreparacion antes de notificar a los apoderados.
     */
    public void marcarListaParaRetiro(Long encargadoId) {
        if (this.estado != EstadoReserva.PENDIENTE) {
            throw new IllegalStateException("La reserva no está en estado PENDIENTE (estado actual: " + this.estado + ").");
        }
        this.estado = EstadoReserva.LISTA_PARA_RETIRO;
        this.preparadaPorId = encargadoId;
        this.fechaPreparacion = LocalDateTime.now();
        notificarApoderadosPorCorreo();
    }

    /**
     * HU35 y HU48: Cancelación permitida para Encargado, Apoderado o Alumno.
     */
    public void cancelar(String motivo, Long usuarioId, String rol) {
        if (this.estado == EstadoReserva.ENTREGADA) {
            throw new IllegalStateException("No se puede cancelar una reserva ya entregada.");
        }
        if (this.estado == EstadoReserva.CANCELADA) {
            throw new IllegalStateException("La reserva ya se encuentra cancelada.");
        }
        if (rol != null && !rol.isBlank()) {
            String r = rol.trim().toUpperCase();
            if (!r.equals("ENC") && !r.equals("APO") && !r.equals("ALU") && !r.equals("ADMIN")) {
                throw new IllegalArgumentException("Rol no autorizado para cancelar la reserva: " + rol);
            }
        }
        this.estado = EstadoReserva.CANCELADA;
        this.motivoCancelacion = motivo;
        this.canceladaPorId = usuarioId;
    }

    /**
     * HU33: Retiro de materiales y generación formal de Entrega por concepto.
     */
    public Entrega confirmarRetiroYGenerarEntrega(Long encargadoId) {
        if (this.estado != EstadoReserva.LISTA_PARA_RETIRO && this.estado != EstadoReserva.PENDIENTE) {
            throw new IllegalStateException("La reserva no está lista para entrega (estado actual: " + this.estado + ").");
        }
        this.estado = EstadoReserva.ENTREGADA;
        String numero = "ENT-RES-" + System.currentTimeMillis();
        Entrega entrega = new Entrega(numero, this.id, this.alumnoId, OrigenEntrega.RESERVA, this.total, encargadoId);
        for (DetalleReserva det : this.detalles) {
            entrega.agregarDetalle(det.getProductoId(), det.getNombreProducto(), det.getCantidad(), det.getPrecioUnitario());
        }
        entrega.cobrarSaldoEnMsSaldos();
        entrega.descontarStockEnMsInventario();
        entrega.notificarApoderadosPorCorreo();
        return entrega;
    }

    public void notificarApoderadosPorCorreo() {
        log.info("[MS-RESERVAS] Notificación por correo enviada a apoderados del alumnoId={} para reserva {} (estado: {})",
                alumnoId, codigo, estado);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getCreadaPorId() { return creadaPorId; }
    public void setCreadaPorId(Long creadaPorId) { this.creadaPorId = creadaPorId; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public int getTotal() { return total; }
    public void setTotal(int total) { this.total = total; }

    public EstadoReserva getEstado() { return estado; }
    public void setEstado(EstadoReserva estado) { this.estado = estado; }

    public String getMotivoCancelacion() { return motivoCancelacion; }
    public void setMotivoCancelacion(String motivoCancelacion) { this.motivoCancelacion = motivoCancelacion; }

    public Long getCanceladaPorId() { return canceladaPorId; }
    public void setCanceladaPorId(Long canceladaPorId) { this.canceladaPorId = canceladaPorId; }

    public Long getPreparadaPorId() { return preparadaPorId; }
    public void setPreparadaPorId(Long preparadaPorId) { this.preparadaPorId = preparadaPorId; }

    public LocalDateTime getFechaPreparacion() { return fechaPreparacion; }
    public void setFechaPreparacion(LocalDateTime fechaPreparacion) { this.fechaPreparacion = fechaPreparacion; }

    public List<DetalleReserva> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleReserva> detalles) { this.detalles = detalles; }
}
