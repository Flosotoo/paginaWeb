package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alertas_saldo_bajo")
public class AlertaSaldoBajo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cuenta_saldo_id", nullable = false, unique = true)
    private Long cuentaSaldoId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_saldo_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_alerta_cuenta"))
    private CuentaSaldo cuentaSaldo;

    @Column(name = "umbral_aplicado_clp", nullable = false)
    private int umbralAplicadoClp = 3000;

    @Column(name = "activa", nullable = false)
    private boolean activa = false;

    @Column(name = "fecha_ultimo_aviso")
    private LocalDateTime fechaUltimoAviso;

    public AlertaSaldoBajo() {}

    public AlertaSaldoBajo(Long cuentaSaldoId, int umbralAplicadoClp, boolean activa) {
        this.cuentaSaldoId = cuentaSaldoId;
        this.umbralAplicadoClp = umbralAplicadoClp;
        this.activa = activa;
        if (activa) {
            this.fechaUltimoAviso = LocalDateTime.now();
        }
    }

    public void evaluar(int saldoDisponible) {
        if (saldoDisponible <= this.umbralAplicadoClp) {
            this.activa = true;
            this.fechaUltimoAviso = LocalDateTime.now();
        } else {
            this.activa = false;
        }
    }

    public void reactivar() {
        this.activa = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCuentaSaldoId() { return cuentaSaldoId; }
    public void setCuentaSaldoId(Long cuentaSaldoId) { this.cuentaSaldoId = cuentaSaldoId; }

    public CuentaSaldo getCuentaSaldo() { return cuentaSaldo; }
    public void setCuentaSaldo(CuentaSaldo cuentaSaldo) {
        this.cuentaSaldo = cuentaSaldo;
        if (cuentaSaldo != null && cuentaSaldo.getId() != null) {
            this.cuentaSaldoId = cuentaSaldo.getId();
        }
    }

    public int getUmbralAplicadoClp() { return umbralAplicadoClp; }
    public void setUmbralAplicadoClp(int umbralAplicadoClp) { this.umbralAplicadoClp = umbralAplicadoClp; }

    public boolean isActiva() { return activa; }
    public void setActiva(boolean activa) { this.activa = activa; }

    public LocalDateTime getFechaUltimoAviso() { return fechaUltimoAviso; }
    public void setFechaUltimoAviso(LocalDateTime fechaUltimoAviso) { this.fechaUltimoAviso = fechaUltimoAviso; }
}
