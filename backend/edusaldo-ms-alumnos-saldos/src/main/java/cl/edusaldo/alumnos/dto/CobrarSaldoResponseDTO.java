package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.CuentaSaldo;
import cl.edusaldo.alumnos.model.MovimientoSaldo;

public class CobrarSaldoResponseDTO {
    private Long alumnoId;
    private int montoCobrado;
    private int saldoActual;
    private int saldoComprometido;
    private int saldoDisponible;
    private boolean alertaSaldoBajo;
    private Long movimientoId;

    public CobrarSaldoResponseDTO() {}

    public CobrarSaldoResponseDTO(CuentaSaldo cuenta, int montoCobrado, boolean alertaSaldoBajo, MovimientoSaldo mov) {
        this.alumnoId = cuenta.getAlumnoId();
        this.montoCobrado = montoCobrado;
        this.saldoActual = cuenta.getSaldoActual();
        this.saldoComprometido = cuenta.getSaldoComprometido();
        this.saldoDisponible = cuenta.getSaldoDisponible();
        this.alertaSaldoBajo = alertaSaldoBajo;
        if (mov != null) {
            this.movimientoId = mov.getId();
        }
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMontoCobrado() { return montoCobrado; }
    public void setMontoCobrado(int montoCobrado) { this.montoCobrado = montoCobrado; }

    public int getSaldoActual() { return saldoActual; }
    public void setSaldoActual(int saldoActual) { this.saldoActual = saldoActual; }

    public int getSaldoComprometido() { return saldoComprometido; }
    public void setSaldoComprometido(int saldoComprometido) { this.saldoComprometido = saldoComprometido; }

    public int getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(int saldoDisponible) { this.saldoDisponible = saldoDisponible; }

    public boolean isAlertaSaldoBajo() { return alertaSaldoBajo; }
    public void setAlertaSaldoBajo(boolean alertaSaldoBajo) { this.alertaSaldoBajo = alertaSaldoBajo; }

    public Long getMovimientoId() { return movimientoId; }
    public void setMovimientoId(Long movimientoId) { this.movimientoId = movimientoId; }
}
