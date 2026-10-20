package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones_saldo_pendientes")
public class NotificacionSaldoPendiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alerta_saldo_bajo_id", nullable = false)
    private Long alertaSaldoBajoId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alerta_saldo_bajo_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_notif_saldo_alerta"))
    private AlertaSaldoBajo alertaSaldoBajo;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId;

    @Column(name = "clave_evento", nullable = false, unique = true, length = 100)
    private String claveEvento;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "PENDIENTE";

    @Column(name = "intentos", nullable = false)
    private int intentos = 0;

    @Column(name = "siguiente_intento")
    private LocalDateTime siguienteIntento;

    public NotificacionSaldoPendiente() {}

    public NotificacionSaldoPendiente(Long alertaSaldoBajoId, Long alumnoId, String claveEvento) {
        this.alertaSaldoBajoId = alertaSaldoBajoId;
        this.alumnoId = alumnoId;
        this.claveEvento = claveEvento;
        this.estado = "ENVIADA";
        this.intentos = 1;
        this.siguienteIntento = null;
    }

    public void marcarEnviada() {
        this.estado = "ENVIADA";
        this.siguienteIntento = null;
    }

    public void programarReintento() {
        this.estado = "PENDIENTE";
        this.intentos++;
        this.siguienteIntento = LocalDateTime.now().plusMinutes(5);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAlertaSaldoBajoId() { return alertaSaldoBajoId; }
    public void setAlertaSaldoBajoId(Long alertaSaldoBajoId) { this.alertaSaldoBajoId = alertaSaldoBajoId; }

    public AlertaSaldoBajo getAlertaSaldoBajo() { return alertaSaldoBajo; }
    public void setAlertaSaldoBajo(AlertaSaldoBajo alertaSaldoBajo) {
        this.alertaSaldoBajo = alertaSaldoBajo;
        if (alertaSaldoBajo != null && alertaSaldoBajo.getId() != null) {
            this.alertaSaldoBajoId = alertaSaldoBajo.getId();
        }
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public String getClaveEvento() { return claveEvento; }
    public void setClaveEvento(String claveEvento) { this.claveEvento = claveEvento; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getIntentos() { return intentos; }
    public void setIntentos(int intentos) { this.intentos = intentos; }

    public LocalDateTime getSiguienteIntento() { return siguienteIntento; }
    public void setSiguienteIntento(LocalDateTime siguienteIntento) { this.siguienteIntento = siguienteIntento; }
}
