package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "abonos", indexes = {
        @Index(name = "idx_abonos_establecimiento", columnList = "id_establecimiento"),
        @Index(name = "idx_abonos_alumno", columnList = "alumno_id")
})
public class Abono {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cuenta_saldo_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_abono_cuenta"))
    private CuentaSaldo cuentaSaldo;

    @Column(name = "apoderado_id", nullable = false)
    private Long apoderadoId;

    @Column(name = "alumno_id", nullable = false)
    private Long alumnoId;

    @Column(name = "monto", nullable = false)
    private int monto;

    @Enumerated(EnumType.STRING)
    @Column(name = "medio_pago", nullable = false, length = 30)
    private MedioPagoAbono medioPago = MedioPagoAbono.PASARELA_SIMULADA;

    @Column(name = "clave_operacion", unique = true, length = 100)
    private String claveOperacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoAbono estado = EstadoAbono.PENDIENTE;

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    @Column(name = "fecha_resolucion")
    private LocalDateTime fechaResolucion;

    @JsonIgnore
    @OneToOne(mappedBy = "abono", fetch = FetchType.LAZY)
    private PagoWebpaySimulado pagoWebpay;

    @JsonIgnore
    @Hidden
    @Transient
    private String tokenTransaccion;

    @JsonIgnore
    @Hidden
    @Transient
    private LocalDateTime expiraEn;

    public Abono() {
        this.idEstablecimiento = 1L;
    }

    public Abono(Long apoderadoId, Long alumnoId, int monto) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto del abono debe ser mayor a 0");
        }
        this.idEstablecimiento = 1L;
        this.apoderadoId = apoderadoId;
        this.alumnoId = alumnoId;
        this.monto = monto;
        this.medioPago = MedioPagoAbono.PASARELA_SIMULADA;
        this.tokenTransaccion = UUID.randomUUID().toString();
        this.claveOperacion = this.tokenTransaccion;
        this.estado = EstadoAbono.PENDIENTE;
        this.fechaCreacion = LocalDateTime.now();
        this.expiraEn = this.fechaCreacion.plusMinutes(15);
    }

    public static Abono iniciar(Long apoderadoId, Long alumnoId, int monto) {
        return new Abono(apoderadoId, alumnoId, monto);
    }

    public boolean verificarToken(String token) {
        String actualToken = getTokenTransaccion();
        if (token == null || actualToken == null || !token.trim().equals(actualToken)) {
            return false;
        }
        return estaVigente() && this.estado == EstadoAbono.PENDIENTE;
    }

    public boolean estaVigente() {
        LocalDateTime limite = this.expiraEn != null
                ? this.expiraEn
                : (this.fechaCreacion != null ? this.fechaCreacion.plusMinutes(15) : null);
        if (limite == null) {
            return false;
        }
        boolean vigente = LocalDateTime.now().isBefore(limite);
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

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public CuentaSaldo getCuentaSaldo() { return cuentaSaldo; }
    public void setCuentaSaldo(CuentaSaldo cuentaSaldo) { this.cuentaSaldo = cuentaSaldo; }

    public Long getCuentaSaldoId() { return cuentaSaldo != null ? cuentaSaldo.getId() : null; }

    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getMonto() { return monto; }
    public void setMonto(int monto) { this.monto = monto; }

    public MedioPagoAbono getMedioPago() { return medioPago; }
    public void setMedioPago(MedioPagoAbono medioPago) { this.medioPago = medioPago; }

    @JsonIgnore
    @Hidden
    public String getTokenTransaccion() {
        if (tokenTransaccion != null) {
            return tokenTransaccion;
        }
        if (pagoWebpay != null && pagoWebpay.getReferenciaPago() != null) {
            return pagoWebpay.getReferenciaPago();
        }
        return claveOperacion;
    }

    @JsonIgnore
    @Hidden
    public void setTokenTransaccion(String tokenTransaccion) {
        this.tokenTransaccion = tokenTransaccion;
        if (tokenTransaccion != null) {
            this.claveOperacion = tokenTransaccion;
        }
    }

    public String getClaveOperacion() { return claveOperacion; }
    public void setClaveOperacion(String claveOperacion) { this.claveOperacion = claveOperacion; }

    public EstadoAbono getEstado() { return estado; }
    public void setEstado(EstadoAbono estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    @JsonIgnore
    @Hidden
    public LocalDateTime getExpiraEn() {
        if (expiraEn != null) return expiraEn;
        return fechaCreacion != null ? fechaCreacion.plusMinutes(15) : null;
    }
    @JsonIgnore
    @Hidden
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }

    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }

    public PagoWebpaySimulado getPagoWebpay() { return pagoWebpay; }
    public void setPagoWebpay(PagoWebpaySimulado pagoWebpay) { this.pagoWebpay = pagoWebpay; }
}
