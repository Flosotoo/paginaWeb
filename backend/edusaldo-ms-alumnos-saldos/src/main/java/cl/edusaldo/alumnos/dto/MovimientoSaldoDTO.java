package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.MovimientoSaldo;
import cl.edusaldo.alumnos.model.TipoMovimientoSaldo;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.media.Schema;

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

    @JsonProperty("referenciaUnica")
    @JsonAlias({"idempotencyKey", "claveOperacion", "referencia"})
    @Schema(description = "Referencia o código único de la operación para evitar registros duplicados")
    private String referenciaUnica;

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
        this.referenciaUnica = m.getReferenciaUnica();
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

    public String getReferenciaUnica() { return referenciaUnica; }
    public void setReferenciaUnica(String referenciaUnica) { this.referenciaUnica = referenciaUnica; }

    @JsonIgnore
    @Hidden
    public String getIdempotencyKey() { return referenciaUnica; }
    public void setIdempotencyKey(String idempotencyKey) { this.referenciaUnica = idempotencyKey; }
}
