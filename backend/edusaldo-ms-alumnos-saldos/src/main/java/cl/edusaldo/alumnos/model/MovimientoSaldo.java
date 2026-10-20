package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_saldo")
public class MovimientoSaldo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_saldo_id", nullable = false)
    @JsonIgnore
    private CuentaSaldo cuentaSaldo;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 50)
    private TipoMovimientoSaldo tipo;

    @Column(name = "monto", nullable = false)
    private int monto;

    @Column(name = "saldo_resultante", nullable = false)
    private int saldoResultante;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "referencia_id")
    private Long referenciaId;

    @Column(name = "descripcion", nullable = false)
    private String descripcion;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    public MovimientoSaldo() {}

    public MovimientoSaldo(CuentaSaldo cuentaSaldo, TipoMovimientoSaldo tipo, int monto, int saldoResultante,
                           Long referenciaId, String descripcion) {
        this(cuentaSaldo, tipo, monto, saldoResultante, referenciaId, descripcion, null);
    }

    public MovimientoSaldo(CuentaSaldo cuentaSaldo, TipoMovimientoSaldo tipo, int monto, int saldoResultante,
                           Long referenciaId, String descripcion, String idempotencyKey) {
        this.cuentaSaldo = cuentaSaldo;
        this.tipo = tipo;
        this.monto = monto;
        this.saldoResultante = saldoResultante;
        this.referenciaId = referenciaId;
        this.descripcion = descripcion;
        this.idempotencyKey = idempotencyKey;
        this.fecha = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CuentaSaldo getCuentaSaldo() { return cuentaSaldo; }
    public void setCuentaSaldo(CuentaSaldo cuentaSaldo) { this.cuentaSaldo = cuentaSaldo; }

    public TipoMovimientoSaldo getTipo() { return tipo; }
    public void setTipo(TipoMovimientoSaldo tipo) { this.tipo = tipo; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public int getSaldoResultante() { return saldoResultante; }
    public void setSaldoResultante(int saldoResultante) { this.saldoResultante = saldoResultante; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Long getReferenciaId() { return referenciaId; }
    public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
