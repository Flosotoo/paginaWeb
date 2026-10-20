package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_recuperacion", indexes = {
        @Index(name = "idx_token_recuperacion_token", columnList = "token")
})
public class TokenRecuperacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_token_recup_usuario"))
    private Usuario usuario;

    @Column(name = "token", nullable = false, unique = true)
    private String token;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_expiracion", nullable = false)
    private LocalDateTime fechaExpiracion;

    @Column(name = "usado", nullable = false)
    private boolean usado = false;

    public TokenRecuperacion() {
    }

    public TokenRecuperacion(Long usuarioId, String token, LocalDateTime fechaExpiracion) {
        this.usuarioId = usuarioId;
        this.token = token;
        this.fechaExpiracion = fechaExpiracion;
        this.fechaCreacion = LocalDateTime.now();
        this.usado = false;
    }

    public boolean estaVigente() {
        return !usado && LocalDateTime.now().isBefore(fechaExpiracion);
    }

    public void marcarUsado() {
        this.usado = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUsuarioId() {
        if (usuario != null && usuario.getId() != null) {
            return usuario.getId();
        }
        return usuarioId;
    }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
        if (usuario != null && usuario.getId() != null) {
            this.usuarioId = usuario.getId();
        }
    }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
    public LocalDateTime getFechaExpiracion() { return fechaExpiracion; }
    public void setFechaExpiracion(LocalDateTime fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }
    public boolean isUsado() { return usado; }
    public void setUsado(boolean usado) { this.usado = usado; }
}
