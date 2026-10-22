package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tokens_recuperacion", indexes = {
        @Index(name = "idx_token_recuperacion_hash", columnList = "hash_token")
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

    @Column(name = "hash_token", nullable = false, unique = true)
    private String hashToken;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "vence_en", nullable = false)
    private LocalDateTime venceEn;

    @Column(name = "utilizado", nullable = false)
    private boolean utilizado = false;

    public TokenRecuperacion() {
    }

    public TokenRecuperacion(Long usuarioId, String hashToken, LocalDateTime venceEn) {
        this.usuarioId = usuarioId;
        this.hashToken = hashToken;
        this.venceEn = venceEn;
        this.fechaCreacion = LocalDateTime.now();
        this.utilizado = false;
    }

    public boolean estaVigente() {
        return !utilizado && LocalDateTime.now().isBefore(venceEn);
    }

    public void marcarUsado() {
        this.utilizado = true;
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

    public String getHashToken() { return hashToken; }
    public void setHashToken(String hashToken) { this.hashToken = hashToken; }

    public String getToken() { return hashToken; }
    public void setToken(String token) { this.hashToken = token; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getVenceEn() { return venceEn; }
    public void setVenceEn(LocalDateTime venceEn) { this.venceEn = venceEn; }

    public LocalDateTime getFechaExpiracion() { return venceEn; }
    public void setFechaExpiracion(LocalDateTime fechaExpiracion) { this.venceEn = fechaExpiracion; }

    public boolean isUtilizado() { return utilizado; }
    public void setUtilizado(boolean utilizado) { this.utilizado = utilizado; }

    public boolean isUsado() { return utilizado; }
    public void setUsado(boolean usado) { this.utilizado = usado; }
}
