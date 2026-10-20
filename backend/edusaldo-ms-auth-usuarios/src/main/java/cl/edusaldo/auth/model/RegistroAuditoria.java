package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registro_auditoria", indexes = {
        @Index(name = "idx_auditoria_usuario", columnList = "usuario_id"),
        @Index(name = "idx_auditoria_fecha", columnList = "fecha_hora")
})
public class RegistroAuditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_auditoria_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora = LocalDateTime.now();

    @Column(name = "usuario_id")
    private Long usuarioId = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_auditoria_usuario"))
    private Usuario usuario;

    @Column(name = "accion", nullable = false, length = 100)
    private String accion;

    @Column(name = "entidad", nullable = false, length = 100)
    private String entidad;

    @Column(name = "entidad_id", nullable = false, length = 100)
    private String entidadId;

    @Column(name = "detalle", length = 1000)
    private String detalle;

    public RegistroAuditoria() {
        this.idEstablecimiento = 1L;
    }

    public RegistroAuditoria(Long usuarioId, String accion, String entidad, String entidadId, String detalle) {
        this.idEstablecimiento = 1L;
        this.usuarioId = (usuarioId != null && usuarioId > 0L) ? usuarioId : 1L;
        this.accion = accion;
        this.entidad = entidad;
        this.entidadId = entidadId != null ? entidadId : "-";
        this.detalle = detalle;
        this.fechaHora = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getIdEstablecimiento() {
        if (establecimiento != null && establecimiento.getId() != null) {
            return establecimiento.getId();
        }
        return idEstablecimiento != null ? idEstablecimiento : 1L;
    }

    public void setIdEstablecimiento(Long idEstablecimiento) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
    }

    public ConfiguracionInstitucional getEstablecimiento() {
        return establecimiento;
    }

    public void setEstablecimiento(ConfiguracionInstitucional establecimiento) {
        this.establecimiento = establecimiento;
        if (establecimiento != null && establecimiento.getId() != null) {
            this.idEstablecimiento = establecimiento.getId();
        }
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
        if (usuario != null && usuario.getId() != null) {
            this.usuarioId = usuario.getId();
        }
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public String getEntidadId() {
        return entidadId;
    }

    public void setEntidadId(String entidadId) {
        this.entidadId = entidadId;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }
}
