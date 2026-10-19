package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.MovimientoSaldo;
import cl.edusaldo.alumnos.model.TipoMovimientoSaldo;

import java.time.LocalDateTime;

public class MovimientoSaldoDTO {
    private Long id;
    private Long cuentaSaldoId;
    private TipoMovimientoSaldo tipo;
    private int monto;
    private int saldoResultante;
    private LocalDateTime fecha;
    private Long referenciaId;
    private String descripcion;
    private String idempotencyKey;

    public MovimientoSaldoDTO() {}

    public MovimientoSaldoDTO(MovimientoSaldo m) {
        this.id = m.getId();
        if (m.getCuentaSaldo() != null) {
            this.cuentaSaldoId = m.getCuentaSaldo().getId();
        }
        this.tipo = m.getTipo();
        this.monto = m.getMonto();
        this.saldoResultante = m.getSaldoResultante();
        this.fecha = m.getFecha();
        this.referenciaId = m.getReferenciaId();
        this.descripcion = m.getDescripcion();
        this.idempotencyKey = m.getIdempotencyKey();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCuentaSaldoId() { return cuentaSaldoId; }
    public void setCuentaSaldoId(Long cuentaSaldoId) { this.cuentaSaldoId = cuentaSaldoId; }

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
