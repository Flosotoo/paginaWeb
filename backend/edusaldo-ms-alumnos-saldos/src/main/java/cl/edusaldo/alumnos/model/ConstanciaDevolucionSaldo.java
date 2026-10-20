package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "constancias_devolucion_saldo")
public class ConstanciaDevolucionSaldo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cuenta_saldo_id", nullable = false)
    private Long cuentaSaldoId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_saldo_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_constancia_cuenta"))
    private CuentaSaldo cuentaSaldo;

    @Column(name = "movimiento_saldo_id", nullable = false, unique = true)
    private Long movimientoSaldoId;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimiento_saldo_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_constancia_movimiento"))
    private MovimientoSaldo movimientoSaldo;

    @Column(name = "administrador_id", nullable = false)
    private Long administradorId = 1L;

    @Column(name = "apoderado_id", nullable = false)
    private Long apoderadoId;

    @Column(name = "monto_clp", nullable = false)
    private int montoClp;

    @Column(name = "medio", length = 50)
    private String medio;

    @Column(name = "fecha_entrega_dinero", nullable = false)
    private LocalDate fechaEntregaDinero = LocalDate.now();

    @Column(name = "referencia", nullable = false, unique = true, length = 100)
    private String referencia;

    @Column(name = "motivo", length = 255)
    private String motivo;

    public ConstanciaDevolucionSaldo() {}

    public ConstanciaDevolucionSaldo(Long cuentaSaldoId, Long movimientoSaldoId, Long administradorId,
                                     Long apoderadoId, int montoClp, String medio, String referencia, String motivo) {
        this.cuentaSaldoId = cuentaSaldoId;
        this.movimientoSaldoId = movimientoSaldoId;
        this.administradorId = administradorId != null ? administradorId : 1L;
        this.apoderadoId = apoderadoId != null ? apoderadoId : 3L;
        this.montoClp = montoClp;
        this.medio = medio;
        this.fechaEntregaDinero = LocalDate.now();
        this.referencia = referencia;
        this.motivo = motivo;
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

    public Long getMovimientoSaldoId() { return movimientoSaldoId; }
    public void setMovimientoSaldoId(Long movimientoSaldoId) { this.movimientoSaldoId = movimientoSaldoId; }

    public MovimientoSaldo getMovimientoSaldo() { return movimientoSaldo; }
    public void setMovimientoSaldo(MovimientoSaldo movimientoSaldo) {
        this.movimientoSaldo = movimientoSaldo;
        if (movimientoSaldo != null && movimientoSaldo.getId() != null) {
            this.movimientoSaldoId = movimientoSaldo.getId();
        }
    }

    public Long getAdministradorId() { return administradorId; }
    public void setAdministradorId(Long administradorId) { this.administradorId = administradorId; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public int getMontoClp() { return montoClp; }
    public void setMontoClp(int montoClp) { this.montoClp = montoClp; }

    public String getMedio() { return medio; }
    public void setMedio(String medio) { this.medio = medio; }

    public LocalDate getFechaEntregaDinero() { return fechaEntregaDinero; }
    public void setFechaEntregaDinero(LocalDate fechaEntregaDinero) { this.fechaEntregaDinero = fechaEntregaDinero; }

    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia = referencia; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
