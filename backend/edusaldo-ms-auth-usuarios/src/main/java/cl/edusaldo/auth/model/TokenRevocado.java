package cl.edusaldo.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_revocados")
public class TokenRevocado {

    @Id
    @Column(name = "jti", length = 100)
    private String jti;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "fecha_revocacion", nullable = false)
    private LocalDateTime fechaRevocacion = LocalDateTime.now();

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    public TokenRevocado() {
    }

    public TokenRevocado(String jti, Long usuarioId, LocalDateTime fechaExpiracion) {
        this.jti = jti;
        this.usuarioId = usuarioId;
        this.fechaExpiracion = fechaExpiracion;
        this.fechaRevocacion = LocalDateTime.now();
    }

    public boolean haExpirado() {
        return LocalDateTime.now().isAfter(fechaExpiracion);
    }

    public String getJti() { return jti; }
    public Long getUsuarioId() { return usuarioId; }
    public LocalDateTime getFechaRevocacion() { return fechaRevocacion; }
    public LocalDateTime getFechaExpiracion() { return fechaExpiracion; }
}
