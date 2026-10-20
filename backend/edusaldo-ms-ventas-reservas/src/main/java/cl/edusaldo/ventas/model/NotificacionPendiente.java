package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones_pendientes")
public class NotificacionPendiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "reserva_id")
    private Long reservaId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_notificacion_reserva"))
    private Reserva reserva;

    @Column(name = "entrega_id")
    private Long entregaId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_notificacion_entrega"))
    private Entrega entrega;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId;

    @Column(name = "tipo_evento", nullable = false, length = 50)
    private String tipoEvento;

    @Column(name = "referencia_operacion", length = 100)
    private String referenciaOperacion;

    @Column(name = "destinatario_correo", nullable = false, length = 150)
    private String destinatarioCorreo;

    @Column(name = "asunto", nullable = false, length = 200)
    private String asunto;

    @Column(name = "mensaje", nullable = false, length = 1000)
    private String mensaje;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "ENVIADA";

    @Column(name = "intentos", nullable = false)
    private int intentos = 1;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_envio")
    private LocalDateTime fechaEnvio = LocalDateTime.now();

    @Column(name = "siguiente_intento")
    private LocalDateTime siguienteIntento;

    public NotificacionPendiente() {
        this.idEstablecimiento = 1L;
    }

    public NotificacionPendiente(Long reservaId, Long entregaId, Long alumnoId, String tipoEvento,
                                 String destinatarioCorreo, String asunto, String mensaje) {
        this.idEstablecimiento = 1L;
        this.reservaId = reservaId;
        this.entregaId = entregaId;
        this.alumnoId = alumnoId;
        this.tipoEvento = tipoEvento;
        this.referenciaOperacion = tipoEvento + "-" + (reservaId != null ? reservaId : entregaId);
        this.destinatarioCorreo = destinatarioCorreo != null ? destinatarioCorreo : "apoderado@colegio.cl";
        this.asunto = asunto;
        this.mensaje = mensaje;
        this.estado = "ENVIADA";
        this.intentos = 1;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaEnvio = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }
    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }
    public Long getEntregaId() { return entregaId; }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }
    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }
    public String getReferenciaOperacion() { return referenciaOperacion; }
    public void setReferenciaOperacion(String referenciaOperacion) { this.referenciaOperacion = referenciaOperacion; }
    public String getDestinatarioCorreo() { return destinatarioCorreo; }
    public void setDestinatarioCorreo(String destinatarioCorreo) { this.destinatarioCorreo = destinatarioCorreo; }
    public String getAsunto() { return asunto; }
    public void setAsunto(String asunto) { this.asunto = asunto; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public LocalDateTime getFechaEnvio() { return fechaEnvio; }
    public void setFechaEnvio(LocalDateTime fechaEnvio) { this.fechaEnvio = fechaEnvio; }
    public LocalDateTime getSiguienteIntento() { return siguienteIntento; }
    public void setSiguienteIntento(LocalDateTime siguienteIntento) { this.siguienteIntento = siguienteIntento; }
}
