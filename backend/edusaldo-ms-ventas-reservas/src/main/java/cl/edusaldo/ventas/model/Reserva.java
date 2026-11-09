package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Entity
@Table(
    name = "reservas",
    indexes = {
      @Index(name = "idx_reservas_establecimiento", columnList = "id_establecimiento"),
      @Index(name = "idx_reservas_alumno", columnList = "alumno_id")
    })
public class Reserva {

  private static final Logger log = LoggerFactory.getLogger(Reserva.class);

  @Column(name = "estado_operacion", nullable = false, length = 40)
  private String estadoOperacion = "COMPLETADA";

  public String getEstadoOperacion() {
    return estadoOperacion;
  }

  public void setEstadoOperacion(String estado) {
    estadoOperacion = estado;
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "id_establecimiento", nullable = false)
  private Long idEstablecimiento = 1L;

  @Column(name = "codigo", nullable = false, unique = true, length = 50)
  private String codigo;

  @Column(name = "alumno_id", nullable = false)
  private Long alumnoId;

  @Column(name = "creada_por_id", nullable = false)
  private Long creadaPorId;

  @Column(name = "fecha_creacion", nullable = false)
  private LocalDateTime fechaCreacion = LocalDateTime.now();

  @Column(name = "total", nullable = false)
  private int total;

  @Enumerated(EnumType.STRING)
  @Column(name = "estado", nullable = false, length = 30)
  private EstadoReserva estado = EstadoReserva.PENDIENTE;

  @Column(name = "motivo_cancelacion")
  private String motivoCancelacion;

  @Column(name = "cancelada_por_id")
  private Long canceladaPorId;

  @Column(name = "preparada_por_id")
  private Long preparadaPorId;

  @Column(name = "fecha_preparacion")
  private LocalDateTime fechaPreparacion;

  @JsonIgnore
  @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<DetalleReserva> detalles = new ArrayList<>();

  @JsonIgnore
  @OneToMany(mappedBy = "reserva", fetch = FetchType.LAZY)
  private List<Entrega> entregas = new ArrayList<>();

  @JsonIgnore
  @OneToMany(mappedBy = "reserva", fetch = FetchType.LAZY)
  private List<NotificacionPendiente> notificaciones = new ArrayList<>();

  public Reserva() {
    this.idEstablecimiento = 1L;
  }

  public Reserva(String codigo, Long alumnoId, Long creadaPorId, int total) {
    this.idEstablecimiento = 1L;
    this.codigo = codigo;
    this.alumnoId = alumnoId;
    this.creadaPorId = creadaPorId;
    this.total = total;
    this.estado = EstadoReserva.PENDIENTE;
    this.fechaCreacion = LocalDateTime.now();
  }

  public void agregarDetalle(
      Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
    this.detalles.add(
        new DetalleReserva(this, productoId, nombreProducto, cantidad, precioUnitario));
  }

  public int calcularTotal() {
    this.total = this.detalles.stream().map(DetalleReserva::getSubtotal).reduce(0, Math::addExact);
    return this.total;
  }

  public void confirmar() {
    if (this.detalles.isEmpty()) {
      throw new IllegalStateException("La reserva debe contener al menos un material.");
    }
    calcularTotal();
    this.estado = EstadoReserva.PENDIENTE;
  }

  public void marcarListaParaRetiro(Long encargadoId) {
    if (this.estado != EstadoReserva.PENDIENTE) {
      throw new IllegalStateException(
          "La reserva no está en estado PENDIENTE (estado actual: " + this.estado + ").");
    }
    this.estado = EstadoReserva.LISTA_PARA_RETIRO;
    this.preparadaPorId = encargadoId;
    this.fechaPreparacion = LocalDateTime.now();
  }

  public void cancelar(String motivo, Long usuarioId, String rol) {
    if (this.estado == EstadoReserva.ENTREGADA) {
      throw new IllegalStateException("No se puede cancelar una reserva ya entregada.");
    }
    if (this.estado == EstadoReserva.CANCELADA) {
      throw new IllegalStateException("La reserva ya se encuentra cancelada.");
    }
    if (rol != null && !rol.isBlank()) {
      String r = rol.trim().toUpperCase().replace("ROLE_", "");
      boolean esStaff =
          r.equals("ENC")
              || r.equals("ENCARGADO")
              || r.equals("ADMIN")
              || r.equals("ADMINISTRADOR");
      boolean esFamilia =
          r.equals("APO") || r.equals("APODERADO") || r.equals("ALU") || r.equals("ALUMNO");

      if (!esStaff && !esFamilia) {
        throw new IllegalArgumentException("Rol no autorizado para cancelar la reserva: " + rol);
      }
      if (esFamilia && this.estado != EstadoReserva.PENDIENTE) {
        throw new IllegalStateException(
            "El apoderado o alumno solo puede cancelar reservas en estado PENDIENTE. Para pedidos"
                + " ya preparados debe solicitarlo al encargado.");
      }
    }
    this.estado = EstadoReserva.CANCELADA;
    this.motivoCancelacion = motivo;
    this.canceladaPorId = usuarioId;
  }

  public Entrega confirmarRetiroYGenerarEntrega(Long encargadoId) {
    if (this.estado != EstadoReserva.LISTA_PARA_RETIRO) {
      throw new IllegalStateException(
          "La reserva no está lista para entrega (estado actual: " + this.estado + ").");
    }
    this.estado = EstadoReserva.ENTREGADA;
    String numero = "ENT-RES-" + java.util.UUID.randomUUID();
    Entrega entrega =
        new Entrega(numero, this.id, this.alumnoId, OrigenEntrega.RESERVA, this.total, encargadoId);
    entrega.setIdEstablecimiento(this.getIdEstablecimiento());
    for (DetalleReserva det : this.detalles) {
      entrega.agregarDetalle(
          det.getProductoId(), det.getNombreProducto(), det.getCantidad(), det.getPrecioUnitario());
    }
    return entrega;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getIdEstablecimiento() {
    return idEstablecimiento != null ? idEstablecimiento : 1L;
  }

  public void setIdEstablecimiento(Long idEstablecimiento) {
    this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
  }

  public String getCodigo() {
    return codigo;
  }

  public void setCodigo(String codigo) {
    this.codigo = codigo;
  }

  public Long getAlumnoId() {
    return alumnoId;
  }

  public void setAlumnoId(Long alumnoId) {
    this.alumnoId = alumnoId;
  }

  public Long getCreadaPorId() {
    return creadaPorId;
  }

  public void setCreadaPorId(Long creadaPorId) {
    this.creadaPorId = creadaPorId;
  }

  public LocalDateTime getFechaCreacion() {
    return fechaCreacion;
  }

  public void setFechaCreacion(LocalDateTime fechaCreacion) {
    this.fechaCreacion = fechaCreacion;
  }

  public int getTotal() {
    return total;
  }

  public void setTotal(int total) {
    this.total = total;
  }

  public EstadoReserva getEstado() {
    return estado;
  }

  public void setEstado(EstadoReserva estado) {
    this.estado = estado;
  }

  public String getMotivoCancelacion() {
    return motivoCancelacion;
  }

  public void setMotivoCancelacion(String motivoCancelacion) {
    this.motivoCancelacion = motivoCancelacion;
  }

  public Long getCanceladaPorId() {
    return canceladaPorId;
  }

  public void setCanceladaPorId(Long canceladaPorId) {
    this.canceladaPorId = canceladaPorId;
  }

  public Long getPreparadaPorId() {
    return preparadaPorId;
  }

  public void setPreparadaPorId(Long preparadaPorId) {
    this.preparadaPorId = preparadaPorId;
  }

  public LocalDateTime getFechaPreparacion() {
    return fechaPreparacion;
  }

  public void setFechaPreparacion(LocalDateTime fechaPreparacion) {
    this.fechaPreparacion = fechaPreparacion;
  }

  public List<DetalleReserva> getDetalles() {
    return detalles;
  }

  public void setDetalles(List<DetalleReserva> detalles) {
    this.detalles = detalles;
  }

  public List<Entrega> getEntregas() {
    return entregas;
  }

  public void setEntregas(List<Entrega> entregas) {
    this.entregas = entregas;
  }

  public List<NotificacionPendiente> getNotificaciones() {
    return notificaciones;
  }

  public void setNotificaciones(List<NotificacionPendiente> notificaciones) {
    this.notificaciones = notificaciones;
  }
}
