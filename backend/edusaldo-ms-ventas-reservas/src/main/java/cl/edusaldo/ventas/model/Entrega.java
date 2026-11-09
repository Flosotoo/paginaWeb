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
    name = "entregas",
    uniqueConstraints = @UniqueConstraint(name = "uk_entrega_reserva", columnNames = "reserva_id"),
    indexes = {
      @Index(name = "idx_entregas_establecimiento", columnList = "id_establecimiento"),
      @Index(name = "idx_entregas_alumno", columnList = "alumno_id")
    })
public class Entrega {

  private static final Logger log = LoggerFactory.getLogger(Entrega.class);

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

  @Column(name = "numero", nullable = false, unique = true, length = 50)
  private String numero;

  @Column(name = "reserva_id")
  private Long reservaId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "reserva_id",
      insertable = false,
      updatable = false,
      foreignKey = @ForeignKey(name = "fk_entrega_reserva"))
  private Reserva reserva;

  @Column(name = "alumno_id", nullable = false)
  private Long alumnoId;

  @Enumerated(EnumType.STRING)
  @Column(name = "origen", nullable = false, length = 20)
  private OrigenEntrega origen;

  @Column(name = "fecha", nullable = false)
  private LocalDateTime fecha = LocalDateTime.now();

  @Column(name = "total", nullable = false)
  private int total;

  @Column(name = "encargado_id", nullable = false)
  private Long encargadoId;

  @JsonIgnore
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

  public Entrega(
      String numero,
      Long reservaId,
      Long alumnoId,
      OrigenEntrega origen,
      int total,
      Long encargadoId) {
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
    this.total = this.detalles.stream().map(DetalleEntrega::getSubtotal).reduce(0, Math::addExact);
    return this.total;
  }

  public void agregarDetalle(
      Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
    this.detalles.add(
        new DetalleEntrega(this, productoId, nombreProducto, cantidad, precioUnitario));
  }

  public static Entrega registrarEnMeson(
      Long alumnoId, Long encargadoId, List<DetalleEntrega> items) {
    String numero = "ENT-MES-" + java.util.UUID.randomUUID();
    Entrega entrega = new Entrega(numero, null, alumnoId, OrigenEntrega.MESON, 0, encargadoId);
    if (items != null) {
      for (DetalleEntrega item : items) {
        item.setEntrega(entrega);
        entrega.getDetalles().add(item);
      }
    }
    entrega.calcularTotal();
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

  public String getNumero() {
    return numero;
  }

  public void setNumero(String numero) {
    this.numero = numero;
  }

  public Long getReservaId() {
    if (reserva != null && reserva.getId() != null) {
      return reserva.getId();
    }
    return reservaId;
  }

  public void setReservaId(Long reservaId) {
    this.reservaId = reservaId;
  }

  public Reserva getReserva() {
    return reserva;
  }

  public void setReserva(Reserva reserva) {
    this.reserva = reserva;
    if (reserva != null && reserva.getId() != null) {
      this.reservaId = reserva.getId();
    }
  }

  public Long getAlumnoId() {
    return alumnoId;
  }

  public void setAlumnoId(Long alumnoId) {
    this.alumnoId = alumnoId;
  }

  public OrigenEntrega getOrigen() {
    return origen;
  }

  public void setOrigen(OrigenEntrega origen) {
    this.origen = origen;
  }

  public LocalDateTime getFecha() {
    return fecha;
  }

  public void setFecha(LocalDateTime fecha) {
    this.fecha = fecha;
  }

  public int getTotal() {
    return total;
  }

  public void setTotal(int total) {
    this.total = total;
  }

  public Long getEncargadoId() {
    return encargadoId;
  }

  public void setEncargadoId(Long encargadoId) {
    this.encargadoId = encargadoId;
  }

  public List<DetalleEntrega> getDetalles() {
    return detalles;
  }

  public void setDetalles(List<DetalleEntrega> detalles) {
    this.detalles = detalles;
  }

  public List<Devolucion> getDevoluciones() {
    return devoluciones;
  }

  public void setDevoluciones(List<Devolucion> devoluciones) {
    this.devoluciones = devoluciones;
  }

  public List<NotificacionPendiente> getNotificaciones() {
    return notificaciones;
  }

  public void setNotificaciones(List<NotificacionPendiente> notificaciones) {
    this.notificaciones = notificaciones;
  }
}
