package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.CuentaSaldo;
import cl.edusaldo.alumnos.model.EstadoAbono;
import cl.edusaldo.alumnos.model.MovimientoSaldo;

import java.time.LocalDateTime;

public class ConfirmarAbonoResponseDTO {
    private Long id;
    private String token;
    private EstadoAbono estado;
    private int monto;
    private Long alumnoId;
    private Long apoderadoId;
    private LocalDateTime fechaResolucion;
    private int saldoActual;
    private int saldoComprometido;
    private int saldoDisponible;
    private Long movimientoId;

    public ConfirmarAbonoResponseDTO() {}

    public ConfirmarAbonoResponseDTO(Abono abono, CuentaSaldo cuenta, MovimientoSaldo mov) {
        this.id = abono.getId();
        this.token = abono.getTokenTransaccion();
        this.estado = abono.getEstado();
        this.monto = abono.getMonto();
        this.alumnoId = abono.getAlumnoId();
        this.apoderadoId = abono.getApoderadoId();
        this.fechaResolucion = abono.getFechaResolucion();
        if (cuenta != null) {
            this.saldoActual = cuenta.getSaldoActual();
            this.saldoComprometido = cuenta.getSaldoComprometido();
            this.saldoDisponible = cuenta.getSaldoDisponible();
        }
        if (mov != null) {
            this.movimientoId = mov.getId();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public EstadoAbono getEstado() { return estado; }
    public void setEstado(EstadoAbono estado) { this.estado = estado; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }

    public int getSaldoActual() { return saldoActual; }
    public void setSaldoActual(int saldoActual) { this.saldoActual = saldoActual; }

    public int getSaldoComprometido() { return saldoComprometido; }
    public void setSaldoComprometido(int saldoComprometido) { this.saldoComprometido = saldoComprometido; }

    public int getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(int saldoDisponible) { this.saldoDisponible = saldoDisponible; }

    public Long getMovimientoId() { return movimientoId; }
    public void setMovimientoId(Long movimientoId) { this.movimientoId = movimientoId; }
}
