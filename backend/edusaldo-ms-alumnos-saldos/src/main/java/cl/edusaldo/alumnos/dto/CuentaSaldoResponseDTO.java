package cl.edusaldo.alumnos.dto;

import cl.edusaldo.alumnos.model.CuentaSaldo;
import java.time.LocalDateTime;

public class CuentaSaldoResponseDTO {
    private Long id;
    private Long alumnoId;
    private int saldoActual;
    private int saldoComprometido;
    private int saldoDisponible;
    private LocalDateTime bloqueadaHasta;
    private boolean estaBloqueada;

    public CuentaSaldoResponseDTO() {}

    public CuentaSaldoResponseDTO(CuentaSaldo c) {
        this.id = c.getId();
        this.alumnoId = c.getAlumnoId();
        this.saldoActual = c.getSaldoActual();
        this.saldoComprometido = c.getSaldoComprometido();
        this.saldoDisponible = c.getSaldoDisponible();
        this.bloqueadaHasta = c.getBloqueadaHasta();
        this.estaBloqueada = c.estaBloqueada();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getSaldoActual() { return saldoActual; }
    public void setSaldoActual(int saldoActual) { this.saldoActual = saldoActual; }

    public int getSaldoComprometido() { return saldoComprometido; }
    public void setSaldoComprometido(int saldoComprometido) { this.saldoComprometido = saldoComprometido; }

    public int getSaldoDisponible() { return saldoDisponible; }
    public void setSaldoDisponible(int saldoDisponible) { this.saldoDisponible = saldoDisponible; }

    public LocalDateTime getBloqueadaHasta() { return bloqueadaHasta; }
    public void setBloqueadaHasta(LocalDateTime bloqueadaHasta) { this.bloqueadaHasta = bloqueadaHasta; }

    public boolean isEstaBloqueada() { return estaBloqueada; }
    public void setEstaBloqueada(boolean estaBloqueada) { this.estaBloqueada = estaBloqueada; }
}
