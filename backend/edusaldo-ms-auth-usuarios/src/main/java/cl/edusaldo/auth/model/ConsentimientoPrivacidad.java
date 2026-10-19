package cl.edusaldo.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "consentimientos_privacidad")
public class ConsentimientoPrivacidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "version_aviso", nullable = false, length = 50)
    private String versionAviso;

    @Column(name = "fecha_aceptacion", nullable = false)
    private LocalDateTime fechaAceptacion = LocalDateTime.now();

    @Column(name = "ip_origen", length = 45)
    private String ipOrigen;

    public ConsentimientoPrivacidad() {
    }

    public ConsentimientoPrivacidad(Long usuarioId, String versionAviso, String ipOrigen) {
        this.usuarioId = usuarioId;
        this.versionAviso = versionAviso;
        this.ipOrigen = ipOrigen;
        this.fechaAceptacion = LocalDateTime.now();
    }

    public void aceptar(String version) {
        this.versionAviso = version;
        this.fechaAceptacion = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public String getVersionAviso() {
        return versionAviso;
    }

    public void setVersionAviso(String versionAviso) {
        this.versionAviso = versionAviso;
    }

    public LocalDateTime getFechaAceptacion() {
        return fechaAceptacion;
    }

    public void setFechaAceptacion(LocalDateTime fechaAceptacion) {
        this.fechaAceptacion = fechaAceptacion;
    }

    public String getIpOrigen() {
        return ipOrigen;
    }

    public void setIpOrigen(String ipOrigen) {
        this.ipOrigen = ipOrigen;
    }
}
