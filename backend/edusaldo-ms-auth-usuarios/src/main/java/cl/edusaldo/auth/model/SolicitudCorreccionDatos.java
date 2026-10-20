package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "solicitudes_correccion_datos")
public class SolicitudCorreccionDatos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_solicitud_correccion_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_solicitud_correccion_usuario"))
    private Usuario usuario;

    @Column(name = "campo_solicitado", nullable = false, length = 80)
    private String campoSolicitado;

    @Column(name = "valor_actual", length = 255)
    private String valorActual;

    @Column(name = "valor_propuesto", nullable = false, length = 255)
    private String valorPropuesto;

    @Column(name = "motivo", nullable = false, length = 500)
    private String motivo;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "PENDIENTE";

    @Column(name = "resuelta_por_id")
    private Long resueltaPorId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resuelta_por_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_solicitud_correccion_admin"))
    private Usuario resueltaPor;

    @Column(name = "observacion_resolucion", length = 500)
    private String observacionResolucion;

    @Column(name = "fecha_solicitud", nullable = false)
    private LocalDateTime fechaSolicitud = LocalDateTime.now();

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    public SolicitudCorreccionDatos() {
        this.idEstablecimiento = 1L;
    }

    public SolicitudCorreccionDatos(Long idEstablecimiento, Long usuarioId, String campoSolicitado, String valorActual, String valorPropuesto, String motivo) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
        this.usuarioId = usuarioId;
        this.campoSolicitado = campoSolicitado;
        this.valorActual = valorActual;
        this.valorPropuesto = valorPropuesto;
        this.motivo = motivo;
        this.estado = "PENDIENTE";
        this.fechaSolicitud = LocalDateTime.now();
    }

    public void resolver(boolean aprobar, Long adminId, String observacion) {
        this.estado = aprobar ? "APROBADA" : "RECHAZADA";
        this.resueltaPorId = adminId;
        this.observacionResolucion = observacion;
        this.fechaResolucion = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getCampoSolicitado() { return campoSolicitado; }
    public void setCampoSolicitado(String campoSolicitado) { this.campoSolicitado = campoSolicitado; }
    public String getValorActual() { return valorActual; }
    public void setValorActual(String valorActual) { this.valorActual = valorActual; }
    public String getValorPropuesto() { return valorPropuesto; }
    public void setValorPropuesto(String valorPropuesto) { this.valorPropuesto = valorPropuesto; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Long getResueltaPorId() { return resueltaPorId; }
    public void setResueltaPorId(Long resueltaPorId) { this.resueltaPorId = resueltaPorId; }
    public String getObservacionResolucion() { return observacionResolucion; }
    public void setObservacionResolucion(String observacionResolucion) { this.observacionResolucion = observacionResolucion; }
    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }
    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }
}
