package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "autorizaciones_centro_padres")
public class AutorizacionCentroPadres {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_establecimiento", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_aut_cp_establecimiento"))
    private ConfiguracionInstitucional establecimiento;

    @Column(name = "apoderado_id", nullable = false)
    private Long apoderadoId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apoderado_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_aut_cp_apoderado"))
    private Usuario apoderado;

    @Column(name = "otorgada_por_admin_id", nullable = false)
    private Long otorgadaPorAdminId = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "otorgada_por_admin_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_aut_cp_admin"))
    private Usuario otorgadaPorAdmin;

    @Column(name = "vigente", nullable = false)
    private boolean vigente = true;

    @Column(name = "fecha_autorizacion", nullable = false)
    private LocalDateTime fechaAutorizacion = LocalDateTime.now();

    @Column(name = "fecha_revocacion")
    private LocalDateTime fechaRevocacion;

    public AutorizacionCentroPadres() {}

    public AutorizacionCentroPadres(Long idEstablecimiento, Long apoderadoId, Long otorgadaPorAdminId, boolean vigente) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
        this.apoderadoId = apoderadoId;
        this.otorgadaPorAdminId = otorgadaPorAdminId != null ? otorgadaPorAdminId : 1L;
        this.vigente = vigente;
        this.fechaAutorizacion = LocalDateTime.now();
        this.fechaRevocacion = vigente ? null : LocalDateTime.now();
    }

    public void otorgar(Long adminId) {
        this.vigente = true;
        this.otorgadaPorAdminId = adminId != null ? adminId : 1L;
        this.fechaAutorizacion = LocalDateTime.now();
        this.fechaRevocacion = null;
    }

    public void revocar() {
        this.vigente = false;
        this.fechaRevocacion = LocalDateTime.now();
    }

    public boolean estaVigente() {
        return vigente;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public ConfiguracionInstitucional getEstablecimiento() { return establecimiento; }
    public void setEstablecimiento(ConfiguracionInstitucional establecimiento) { this.establecimiento = establecimiento; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public Usuario getApoderado() { return apoderado; }
    public void setApoderado(Usuario apoderado) { this.apoderado = apoderado; }

    public Long getOtorgadaPorAdminId() { return otorgadaPorAdminId; }
    public void setOtorgadaPorAdminId(Long otorgadaPorAdminId) { this.otorgadaPorAdminId = otorgadaPorAdminId; }

    public Usuario getOtorgadaPorAdmin() { return otorgadaPorAdmin; }
    public void setOtorgadaPorAdmin(Usuario otorgadaPorAdmin) { this.otorgadaPorAdmin = otorgadaPorAdmin; }

    public boolean isVigente() { return vigente; }
    public void setVigente(boolean vigente) { this.vigente = vigente; }

    public LocalDateTime getFechaAutorizacion() { return fechaAutorizacion; }
    public void setFechaAutorizacion(LocalDateTime fechaAutorizacion) { this.fechaAutorizacion = fechaAutorizacion; }

    public LocalDateTime getFechaRevocacion() { return fechaRevocacion; }
    public void setFechaRevocacion(LocalDateTime fechaRevocacion) { this.fechaRevocacion = fechaRevocacion; }
}
