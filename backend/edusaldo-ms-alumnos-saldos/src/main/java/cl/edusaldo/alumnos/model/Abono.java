package cl.edusaldo.alumnos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "abonos")
public class Abono {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "apoderado_id", nullable = false)
    private Long apoderadoId;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId;

    @Column(name = "monto", nullable = false)
    private int monto;

    @Column(name = "token_transaccion", nullable = false, unique = true, length = 100)
    private String tokenTransaccion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoAbono estado = EstadoAbono.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "expira_en", nullable = false)
    private LocalDateTime expiraEn;

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    public Abono() {}

    public Abono(Long apoderadoId, Long alumnoId, int monto) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto del abono debe ser mayor a 0");
        }
        this.apoderadoId = apoderadoId;
        this.alumnoId = alumnoId;
        this.monto = monto;
        this.tokenTransaccion = UUID.randomUUID().toString();
        this.estado = EstadoAbono.PENDIENTE;
        this.fechaCreacion = LocalDateTime.now();
        this.expiraEn = this.fechaCreacion.plusMinutes(15);
    }

    public static Abono iniciar(Long apoderadoId, Long alumnoId, int monto) {
        return new Abono(apoderadoId, alumnoId, monto);
    }

    public boolean verificarToken(String token) {
        if (token == null || !token.trim().equals(this.tokenTransaccion)) {
            return false;
        }
        return estaVigente() && this.estado == EstadoAbono.PENDIENTE;
    }

    public boolean estaVigente() {
        if (this.expiraEn == null) {
            return false;
        }
        boolean vigente = LocalDateTime.now().isBefore(this.expiraEn);
        if (!vigente && this.estado == EstadoAbono.PENDIENTE) {
            this.estado = EstadoAbono.EXPIRADO;
        }
        return vigente;
    }

    public void aprobar(String token) {
        if (!verificarToken(token)) {
            throw new IllegalStateException("Token inválido o abono expirado para su aprobación.");
        }
        aprobar();
    }

    public void aprobar() {
        this.estado = EstadoAbono.APROBADO;
        this.fechaResolucion = LocalDateTime.now();
    }

    public void rechazar(String token) {
        this.estado = EstadoAbono.RECHAZADO;
        this.fechaResolucion = LocalDateTime.now();
    }

    public void rechazar() {
        this.estado = EstadoAbono.RECHAZADO;
        this.fechaResolucion = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public String getTokenTransaccion() { return tokenTransaccion; }
    public void setTokenTransaccion(String tokenTransaccion) { this.tokenTransaccion = tokenTransaccion; }

    public EstadoAbono getEstado() { return estado; }
    public void setEstado(EstadoAbono estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getExpiraEn() { return expiraEn; }
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }

    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }
}
