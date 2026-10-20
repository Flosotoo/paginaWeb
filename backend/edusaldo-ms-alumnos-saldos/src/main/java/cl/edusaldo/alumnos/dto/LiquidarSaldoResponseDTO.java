package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.MovimientoSaldo;

public class LiquidarSaldoResponseDTO {
    private Long alumnoId;
    private Long apoderadoId;
    private int montoLiquidado;
    private int saldoActual;
    private int saldoDisponible;
    private Long movimientoId;

    public LiquidarSaldoResponseDTO() {}

    public LiquidarSaldoResponseDTO(Long alumnoId, Long apoderadoId, int montoLiquidado, MovimientoSaldo mov) {
        this.alumnoId = alumnoId;
        this.apoderadoId = apoderadoId;
        this.montoLiquidado = montoLiquidado;
        this.saldoActual = 0;
        this.saldoDisponible = 0;
        if (mov != null) {
            this.movimientoId = mov.getId();
        }
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public int getMontoLiquidado() { return montoLiquidado; }
    public void setMontoLiquidado(int montoLiquidado) { this.montoLiquidado = montoLiquidado; }

    public int getSaldoActual() { return saldoActual; }
    public void setSaldoActual(int saldoActual) { this.saldoActual = saldoActual; }

    public int getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(int saldoDisponible) { this.saldoDisponible = saldoDisponible; }

    public Long getMovimientoId() { return movimientoId; }
    public void setMovimientoId(Long movimientoId) { this.movimientoId = movimientoId; }
}
