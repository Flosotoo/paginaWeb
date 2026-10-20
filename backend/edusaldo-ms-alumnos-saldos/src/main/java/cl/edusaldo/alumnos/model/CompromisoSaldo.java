package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "compromisos_saldo")
public class CompromisoSaldo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cuenta_saldo_id", nullable = false)
    private Long cuentaSaldoId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_saldo_id", insertable = false, updatable = false,
            foreignKey = @ForeignKey(name = "fk_compromiso_cuenta"))
    private CuentaSaldo cuentaSaldo;

    @Column(name = "reserva_id", nullable = false)
    private Long reservaId;

    @Column(name = "monto_clp", nullable = false)
    private int montoClp;

    @Column(name = "estado", nullable = false, length = 30)
    private String estado = "COMPROMETIDO";

    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion = LocalDateTime.now();

    public CompromisoSaldo() {}

    public CompromisoSaldo(Long cuentaSaldoId, Long reservaId, int montoClp) {
        this.cuentaSaldoId = cuentaSaldoId;
        this.reservaId = reservaId != null ? reservaId : 0L;
        this.montoClp = montoClp;
        this.estado = "COMPROMETIDO";
        this.fechaActualizacion = LocalDateTime.now();
    }

    public void comprometer() {
        this.estado = "COMPROMETIDO";
        this.fechaActualizacion = LocalDateTime.now();
    }

    public void liberar() {
        this.estado = "LIBERADO";
        this.fechaActualizacion = LocalDateTime.now();
    }

    public void consumir() {
        this.estado = "CONSUMIDO";
        this.fechaActualizacion = LocalDateTime.now();
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

    public Long getReservaId() { return reservaId; }
    public void setReservaId(Long reservaId) { this.reservaId = reservaId; }

    public int getMontoClp() { return montoClp; }
    public void setMontoClp(int montoClp) { this.montoClp = montoClp; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
