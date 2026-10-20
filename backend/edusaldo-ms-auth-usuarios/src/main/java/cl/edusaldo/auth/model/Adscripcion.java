package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "adscripciones")
public class Adscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_adscripcion_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_adscripcion_usuario"))
    private Usuario usuario;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "ACTIVA";

    @Column(name = "fecha_adscripcion", nullable = false)
    private LocalDateTime fechaAdscripcion = LocalDateTime.now();

    public Adscripcion() {}

    public Adscripcion(Long idEstablecimiento, Long usuarioId) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
        this.usuarioId = usuarioId;
        this.estado = "ACTIVA";
        this.fechaAdscripcion = LocalDateTime.now();
    }

    public void activar() {
        this.estado = "ACTIVA";
    }

    public void inactivar() {
        this.estado = "INACTIVA";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public ConfiguracionInstitucional getEstablecimiento() { return establecimiento; }
    public void setEstablecimiento(ConfiguracionInstitucional establecimiento) { this.establecimiento = establecimiento; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaAdscripcion() { return fechaAdscripcion; }
    public void setFechaAdscripcion(LocalDateTime fechaAdscripcion) { this.fechaAdscripcion = fechaAdscripcion; }
}
