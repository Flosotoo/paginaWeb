package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.persistence.*;
import java.time.LocalDate;
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
    @OneToOne(mappedBy = "abono", fetch = FetchType.LAZY)
    private TransferenciaBancaria transferencia;

    @JsonIgnore
    @Hidden
    @Transient
    private String tokenTransaccion;

    @JsonIgnore
    @Hidden
    @Transient
    private LocalDate fechaTransferencia;

    @JsonIgnore
    @Hidden
    @Transient
    private String comprobanteUrl;

    @JsonIgnore
    @Hidden
    @Transient
    private Long revisadoPorApoderadoId;

    @JsonIgnore
    @Hidden
    @Transient
    private String motivoRechazo;

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

    public static Abono registrarTransferencia(CuentaSaldo cuenta, Long apoderadoId, Long alumnoId, int monto,
                                               LocalDate fechaTransferencia, String comprobanteUrl, String numeroOperacion) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto de la transferencia debe ser mayor a 0");
        }
        Abono a = new Abono(apoderadoId, alumnoId, monto);
        a.setCuentaSaldo(cuenta);
        a.setIdEstablecimiento(cuenta != null ? cuenta.getIdEstablecimiento() : 1L);
        a.setMedioPago(MedioPagoAbono.TRANSFERENCIA_BANCARIA);
        a.setEstado(EstadoAbono.PENDIENTE_VALIDACION);
        a.setFechaTransferencia(fechaTransferencia != null ? fechaTransferencia : LocalDate.now());
        a.setComprobanteUrl(comprobanteUrl);
        String clave = (numeroOperacion != null && !numeroOperacion.isBlank())
                ? "TRF-" + numeroOperacion.trim() + "-" + UUID.randomUUID().toString().substring(0, 8)
                : "TRF-" + UUID.randomUUID().toString().substring(0, 12);
        a.setClaveOperacion(clave);
        a.tokenTransaccion = null;
        a.expiraEn = null;
        return a;
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

    public void aprobarTransferencia(Long revisorApoderadoId) {
        if (this.medioPago != MedioPagoAbono.TRANSFERENCIA_BANCARIA) {
            throw new IllegalStateException("El abono no corresponde a una transferencia bancaria.");
        }
        if (this.estado != EstadoAbono.PENDIENTE_VALIDACION && this.estado != EstadoAbono.PENDIENTE) {
            throw new IllegalStateException("La transferencia ya fue procesada con estado: " + this.estado);
        }
        this.estado = EstadoAbono.APROBADO;
        this.revisadoPorApoderadoId = revisorApoderadoId;
        this.fechaResolucion = LocalDateTime.now();
    }

    public void rechazarTransferencia(Long revisorApoderadoId, String motivo) {
        if (this.medioPago != MedioPagoAbono.TRANSFERENCIA_BANCARIA) {
            throw new IllegalStateException("El abono no corresponde a una transferencia bancaria.");
        }
        if (this.estado != EstadoAbono.PENDIENTE_VALIDACION && this.estado != EstadoAbono.PENDIENTE) {
            throw new IllegalStateException("La transferencia ya fue procesada con estado: " + this.estado);
        }
        this.estado = EstadoAbono.RECHAZADO;
        this.revisadoPorApoderadoId = revisorApoderadoId;
        this.motivoRechazo = motivo;
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
        return medioPago == MedioPagoAbono.PASARELA_SIMULADA ? claveOperacion : null;
    }

    @JsonIgnore
    @Hidden
    public void setTokenTransaccion(String tokenTransaccion) {
        this.tokenTransaccion = tokenTransaccion;
        if (tokenTransaccion != null && this.medioPago == MedioPagoAbono.PASARELA_SIMULADA) {
            this.claveOperacion = tokenTransaccion;
        }
    }

    public String getClaveOperacion() { return claveOperacion; }
    public void setClaveOperacion(String claveOperacion) { this.claveOperacion = claveOperacion; }

    public EstadoAbono getEstado() { return estado; }
    public void setEstado(EstadoAbono estado) { this.estado = estado; }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public LocalDate getFechaTransferencia() {
        if (fechaTransferencia != null) return fechaTransferencia;
        return transferencia != null ? transferencia.getFechaTransferencia() : null;
    }
    public void setFechaTransferencia(LocalDate fechaTransferencia) { this.fechaTransferencia = fechaTransferencia; }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String getComprobanteUrl() {
        if (comprobanteUrl != null) return comprobanteUrl;
        return transferencia != null ? transferencia.getComprobanteUrl() : null;
    }
    public void setComprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Long getRevisadoPorApoderadoId() {
        if (revisadoPorApoderadoId != null) return revisadoPorApoderadoId;
        return transferencia != null ? transferencia.getRevisadoPorApoderadoId() : null;
    }
    public void setRevisadoPorApoderadoId(Long revisadoPorApoderadoId) { this.revisadoPorApoderadoId = revisadoPorApoderadoId; }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public String getMotivoRechazo() {
        if (motivoRechazo != null) return motivoRechazo;
        return transferencia != null ? transferencia.getMotivoRechazo() : null;
    }
    public void setMotivoRechazo(String motivoRechazo) { this.motivoRechazo = motivoRechazo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    @JsonIgnore
    @Hidden
    public LocalDateTime getExpiraEn() {
        if (expiraEn != null) return expiraEn;
        return medioPago == MedioPagoAbono.PASARELA_SIMULADA && fechaCreacion != null
                ? fechaCreacion.plusMinutes(15) : null;
    }
    @JsonIgnore
    @Hidden
    public void setExpiraEn(LocalDateTime expiraEn) { this.expiraEn = expiraEn; }

    public LocalDateTime getFechaResolucion() { return fechaResolucion; }
    public void setFechaResolucion(LocalDateTime fechaResolucion) { this.fechaResolucion = fechaResolucion; }
}
