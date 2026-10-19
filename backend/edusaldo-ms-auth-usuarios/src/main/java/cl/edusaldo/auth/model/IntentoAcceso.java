package cl.edusaldo.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "intentos_acceso", indexes = {
        @Index(name = "idx_intento_correo_fecha", columnList = "correo, fecha")
})
public class IntentoAcceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "correo", nullable = false, length = 150)
    private String correo;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "exitoso", nullable = false)
    private boolean exitoso;

    public IntentoAcceso() {
    }

    public IntentoAcceso(String correo, LocalDateTime fecha, boolean exitoso) {
        this.correo = correo;
        this.fecha = fecha != null ? fecha : LocalDateTime.now();
        this.exitoso = exitoso;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public boolean isExitoso() {
        return exitoso;
    }

    public void setExitoso(boolean exitoso) {
        this.exitoso = exitoso;
    }
}
