package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "operaciones_distribuidas")
public class OperacionDistribuida {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "id_establecimiento", nullable = false)
  private Long idEstablecimiento = 1L;

  @Column(name = "clave_idempotencia", nullable = false, unique = true, length = 100)
  private String claveIdempotencia;

  @Column(name = "tipo", nullable = false, length = 40)
  private String tipo;

  @Column(name = "estado", nullable = false, length = 40)
  private String estado = "INICIADA";

  @Column(name = "reserva_id")
  private Long reservaId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "reserva_id",
      insertable = false,
      updatable = false,
      foreignKey = @ForeignKey(name = "fk_op_dist_reserva"))
  private Reserva reserva;

  @Column(name = "entrega_id")
  private Long entregaId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "entrega_id",
      insertable = false,
      updatable = false,
      foreignKey = @ForeignKey(name = "fk_op_dist_entrega"))
  private Entrega entrega;

  @Column(name = "devolucion_id")
  private Long devolucionId;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "devolucion_id",
      insertable = false,
      updatable = false,
      foreignKey = @ForeignKey(name = "fk_op_dist_devolucion"))
  private Devolucion devolucion;

  @Column(name = "actualizado_en", nullable = false)
  private LocalDateTime actualizadoEn = LocalDateTime.now();

  @Column(name = "umbral_saldo_bajo", length = 30)
  private String umbralSaldoBajo;

  @Column(name = "recuperada_por_id")
  private Long recuperadaPorId;

  public String getUmbralSaldoBajo() {
    return umbralSaldoBajo;
  }

  public void setUmbralSaldoBajo(String valor) {
    umbralSaldoBajo = valor;
  }

  public Long getRecuperadaPorId() {
    return recuperadaPorId;
  }

  public void setRecuperadaPorId(Long valor) {
    recuperadaPorId = valor;
  }

  @Column(name = "direccion", nullable = false, length = 20)
  private String direccion = "CONTINUAR";

  @Column(name = "pasos_confirmados", nullable = false, columnDefinition = "TEXT")
  private String pasosConfirmados = "|";

  @Column(name = "usuario_id")
  private Long usuarioId;

  @Column(name = "rol", length = 30)
  private String rol;

  @Column(name = "motivo", length = 255)
  private String motivo;

  @Column(name = "ejecucion_hasta")
  private LocalDateTime ejecucionHasta;

  public boolean confirmado(String paso) {
    return pasosConfirmados.contains("|" + paso + "|");
  }

  public void confirmarPaso(String paso) {
    if (!confirmado(paso)) pasosConfirmados += paso + "|";
    marcarPasoConfirmado();
  }

  public String getDireccion() {
    return direccion;
  }

  public void setDireccion(String direccion) {
    this.direccion = direccion;
  }

  public String getPasosConfirmados() {
    return pasosConfirmados;
  }

  public Long getUsuarioId() {
    return usuarioId;
  }

  public void setUsuarioId(Long id) {
    usuarioId = id;
  }

  public String getRol() {
    return rol;
  }

  public void setRol(String valor) {
    rol = valor;
  }

  public String getMotivo() {
    return motivo;
  }

  public void setMotivo(String valor) {
    motivo = valor;
  }

  public LocalDateTime getEjecucionHasta() {
    return ejecucionHasta;
  }

  public void setEjecucionHasta(LocalDateTime valor) {
    ejecucionHasta = valor;
  }

  public OperacionDistribuida() {
    this.idEstablecimiento = 1L;
  }

  public OperacionDistribuida(
      String claveIdempotencia, String tipo, Long reservaId, Long entregaId, Long devolucionId) {
    this.idEstablecimiento = 1L;
    this.claveIdempotencia = claveIdempotencia;
    this.tipo = tipo;
    this.estado = "INICIADA";
    this.reservaId = reservaId;
    this.entregaId = entregaId;
    this.devolucionId = devolucionId;
    this.actualizadoEn = LocalDateTime.now();
  }

  public void marcarPasoConfirmado() {
    this.estado = "PASO_CONFIRMADO";
    this.actualizadoEn = LocalDateTime.now();
  }

  public void marcarPendienteRecuperacion() {
    this.estado = "PENDIENTE_RECUPERACION";
    this.actualizadoEn = LocalDateTime.now();
  }

  public void marcarCompensada() {
    this.estado = "COMPENSADA";
    this.actualizadoEn = LocalDateTime.now();
  }

  public void marcarCompletada() {
    this.estado = "COMPLETADA";
    this.actualizadoEn = LocalDateTime.now();
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

  public String getClaveIdempotencia() {
    return claveIdempotencia;
  }

  public void setClaveIdempotencia(String claveIdempotencia) {
    this.claveIdempotencia = claveIdempotencia;
  }

  public String getTipo() {
    return tipo;
  }

  public void setTipo(String tipo) {
    this.tipo = tipo;
  }

  public String getEstado() {
    return estado;
  }

  public void setEstado(String estado) {
    this.estado = estado;
  }

  public Long getReservaId() {
    return reservaId;
  }

  public void setReservaId(Long reservaId) {
    this.reservaId = reservaId;
  }

  public Long getEntregaId() {
    return entregaId;
  }

  public void setEntregaId(Long entregaId) {
    this.entregaId = entregaId;
  }

  public Long getDevolucionId() {
    return devolucionId;
  }

  public void setDevolucionId(Long devolucionId) {
    this.devolucionId = devolucionId;
  }

  public LocalDateTime getActualizadoEn() {
    return actualizadoEn;
  }

  public void setActualizadoEn(LocalDateTime actualizadoEn) {
    this.actualizadoEn = actualizadoEn;
  }
}
