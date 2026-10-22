package cl.edusaldo.alumnos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "cuentas_saldo", indexes = {
        @Index(name = "idx_cuentas_establecimiento", columnList = "id_establecimiento")
})
public class CuentaSaldo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @Column(name = "alumno_id", nullable = false, unique = true)
    private Long alumnoId;

    @Column(name = "saldo_actual", nullable = false)
    private int saldoActual = 0;

    @Column(name = "saldo_comprometido", nullable = false)
    private int saldoComprometido = 0;

    @Transient
    @JsonIgnore
    private LocalDateTime bloqueadaHasta;

    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    @JsonIgnore
    @OneToMany(mappedBy = "cuentaSaldo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Abono> abonos = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "cuentaSaldo", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MovimientoSaldo> movimientos = new ArrayList<>();

    public CuentaSaldo() {
        this.idEstablecimiento = 1L;
    }

    public CuentaSaldo(Long alumnoId, int saldoInicial) {
        this.idEstablecimiento = 1L;
        this.alumnoId = alumnoId;
        this.saldoActual = Math.max(0, saldoInicial);
        this.saldoComprometido = 0;
    }

    public CuentaSaldo(Long alumnoId, int saldoActual, int saldoComprometido) {
        this.idEstablecimiento = 1L;
        this.alumnoId = alumnoId;
        this.saldoActual = Math.max(0, saldoActual);
        this.saldoComprometido = Math.max(0, saldoComprometido);
    }

    public int getSaldoDisponible() {
        return this.saldoActual - this.saldoComprometido;
    }

    public boolean tieneSaldoDisponible(int monto) {
        return getSaldoDisponible() >= monto;
    }

    @JsonIgnore
    public boolean estaBloqueada() {
        return this.bloqueadaHasta != null && LocalDateTime.now().isBefore(this.bloqueadaHasta);
    }

    public boolean bloquearTemporalmente(int segundos) {
        if (estaBloqueada()) {
            throw new IllegalStateException("La cuenta de saldo está bloqueada temporalmente por otra operación concurrente hasta: " + this.bloqueadaHasta);
        }
        this.bloqueadaHasta = LocalDateTime.now().plusSeconds(segundos);
        return true;
    }

    public void desbloquear() {
        this.bloqueadaHasta = null;
    }

    public MovimientoSaldo acreditarMontoAbonado(Abono abono) {
        if (abono == null || abono.getMonto() <= 0) {
            throw new IllegalArgumentException("El abono debe contener un monto positivo.");
        }
        this.saldoActual += abono.getMonto();
        String ref = abono.getTokenTransaccion() != null ? abono.getTokenTransaccion() : abono.getClaveOperacion();
        String desc = abono.getMedioPago() == MedioPagoAbono.TRANSFERENCIA_BANCARIA
                ? "Abono por transferencia bancaria validada # " + ref
                : "Abono de saldo vía pasarela simulada # " + ref;
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.ABONO,
                abono.getMonto(),
                this.saldoActual,
                abono.getId(),
                desc
        );
        mov.setAbono(abono);
        this.movimientos.add(mov);
        return mov;
    }

    public MovimientoSaldo retenerSaldoPorReserva(int monto, Long reservaId) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a retener debe ser mayor a 0.");
        }
        if (!tieneSaldoDisponible(monto)) {
            throw new IllegalStateException("Saldo insuficiente. Saldo disponible: $" + getSaldoDisponible() + " - Monto requerido: $" + monto);
        }
        this.saldoComprometido += monto;
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.RESERVA,
                monto,
                this.saldoActual,
                reservaId,
                "Retención de saldo por reserva #" + reservaId
        );
        this.movimientos.add(mov);
        return mov;
    }

    public MovimientoSaldo liberarSaldoRetenido(int monto, Long reservaId) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a liberar debe ser mayor a 0.");
        }
        this.saldoComprometido = Math.max(0, this.saldoComprometido - monto);
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.LIBERACION_RESERVA,
                monto,
                this.saldoActual,
                reservaId,
                "Liberación de saldo retenido por cancelación de reserva #" + reservaId
        );
        this.movimientos.add(mov);
        return mov;
    }

    public MovimientoSaldo cobrarEntregaMateriales(int monto, Long entregaId, boolean vieneDeReserva) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a cobrar debe ser mayor a 0.");
        }
        if (vieneDeReserva) {
            this.saldoComprometido = Math.max(0, this.saldoComprometido - monto);
            this.saldoActual = Math.max(0, this.saldoActual - monto);
        } else {
            if (!tieneSaldoDisponible(monto)) {
                throw new IllegalStateException("Saldo insuficiente para entrega presencial. Saldo disponible: $" + getSaldoDisponible() + " - Monto requerido: $" + monto);
            }
            this.saldoActual -= monto;
        }
        String desc = vieneDeReserva
                ? "Cobro de entrega de reserva #" + entregaId
                : "Cobro de entrega presencial en mesón #" + entregaId;
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.ENTREGA,
                monto,
                this.saldoActual,
                entregaId,
                desc
        );
        this.movimientos.add(mov);
        return mov;
    }

    public MovimientoSaldo reembolsarPorDevolucion(int monto, Long devolucionId) {
        if (monto <= 0) {
            throw new IllegalArgumentException("El monto a reembolsar debe ser mayor a 0.");
        }
        this.saldoActual += monto;
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.DEVOLUCION,
                monto,
                this.saldoActual,
                devolucionId,
                "Reembolso de saldo por devolución #" + devolucionId
        );
        this.movimientos.add(mov);
        return mov;
    }

    public MovimientoSaldo liquidarSaldoPorRetiro(Long apoderadoId, String medio, String comprobante, String motivo) {
        if (this.saldoComprometido > 0) {
            throw new IllegalStateException("No se puede liquidar cuenta: el alumno tiene reservas retenidas pendientes ($" + this.saldoComprometido + ").");
        }
        int montoLiquidado = this.saldoActual;
        this.saldoActual = 0;
        MovimientoSaldo mov = new MovimientoSaldo(
                this,
                TipoMovimientoSaldo.DEVOLUCION_SALDO,
                montoLiquidado,
                0,
                apoderadoId,
                "Liquidación de saldo por retiro del alumno. Medio: " + medio + ", Comprobante: " + comprobante + ", Motivo: " + motivo
        );
        this.movimientos.add(mov);
        return mov;
    }

    public boolean cruzoUmbralSaldoBajo(int saldoAnterior, int umbral) {
        return saldoAnterior > umbral && this.saldoActual <= umbral;
    }

    public void comprometer(int monto) {
        retenerSaldoPorReserva(monto, null);
    }

    public void liberar(int monto) {
        liberarSaldoRetenido(monto, null);
    }

    public void finalizarReserva(int monto) {
        cobrarEntregaMateriales(monto, null, true);
    }

    public void abonar(int monto) {
        this.saldoActual += monto;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public int getSaldoActual() { return saldoActual; }
    public void setSaldoActual(int saldoActual) { this.saldoActual = saldoActual; }

    public int getSaldoComprometido() { return saldoComprometido; }
    public void setSaldoComprometido(int saldoComprometido) { this.saldoComprometido = saldoComprometido; }

    @JsonIgnore
    public LocalDateTime getBloqueadaHasta() { return bloqueadaHasta; }
    public void setBloqueadaHasta(LocalDateTime bloqueadaHasta) { this.bloqueadaHasta = bloqueadaHasta; }

    public Long getVersion() { return version != null ? version : 0L; }
    public void setVersion(Long version) { this.version = version != null ? version : 0L; }

    public List<Abono> getAbonos() { return abonos; }
    public void setAbonos(List<Abono> abonos) { this.abonos = abonos; }

    public List<MovimientoSaldo> getMovimientos() { return movimientos; }
    public void setMovimientos(List<MovimientoSaldo> movimientos) { this.movimientos = movimientos; }
}
