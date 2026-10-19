package cl.edusaldo.alumnos.service;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.CuentaSaldo;
import cl.edusaldo.alumnos.model.EstadoAbono;
import cl.edusaldo.alumnos.model.MovimientoSaldo;
import cl.edusaldo.alumnos.model.TipoMovimientoSaldo;
import cl.edusaldo.alumnos.repository.AbonoRepository;
import cl.edusaldo.alumnos.repository.CuentaSaldoRepository;
import cl.edusaldo.alumnos.repository.MovimientoSaldoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SaldoService {

    private final CuentaSaldoRepository cuentaSaldoRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final AbonoRepository abonoRepository;

    public SaldoService(CuentaSaldoRepository cuentaSaldoRepository,
                        MovimientoSaldoRepository movimientoSaldoRepository,
                        AbonoRepository abonoRepository) {
        this.cuentaSaldoRepository = cuentaSaldoRepository;
        this.movimientoSaldoRepository = movimientoSaldoRepository;
        this.abonoRepository = abonoRepository;
    }

    @Transactional
    public CuentaSaldo obtenerCuenta(Long alumnoId) {
        return cuentaSaldoRepository.findByAlumnoId(alumnoId)
                .orElseGet(() -> cuentaSaldoRepository.save(new CuentaSaldo(alumnoId, 0, 0)));
    }

    @Transactional(readOnly = true)
    public CuentaSaldoResponseDTO consultarCuenta(Long alumnoId) {
        CuentaSaldo cuenta = cuentaSaldoRepository.findByAlumnoId(alumnoId)
                .orElseGet(() -> new CuentaSaldo(alumnoId, 0, 0));
        return new CuentaSaldoResponseDTO(cuenta);
    }

    @Transactional
    public IniciarAbonoResponseDTO iniciarAbono(IniciarAbonoDTO dto) {
        if (dto.getMonto() <= 0) {
            throw new IllegalArgumentException("El monto a abonar debe ser mayor a 0");
        }
        // Asegurar existencia de cuenta para el alumno
        obtenerCuenta(dto.getAlumnoId());

        Abono abono = Abono.iniciar(dto.getApoderadoId(), dto.getAlumnoId(), dto.getMonto());
        abono = abonoRepository.save(abono);
        return new IniciarAbonoResponseDTO(abono);
    }

    @Transactional
    public ConfirmarAbonoResponseDTO confirmarAbono(ConfirmarAbonoDTO dto) {
        Abono abono = abonoRepository.findByTokenTransaccion(dto.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Abono no encontrado con token: " + dto.getToken()));

        if (!abono.estaVigente()) {
            abonoRepository.save(abono);
            throw new IllegalStateException("El abono ha expirado o no está vigente.");
        }

        if (abono.getEstado() != EstadoAbono.PENDIENTE) {
            if (abono.getEstado() == EstadoAbono.APROBADO) {
                // Idempotencia: ya aprobado previamente
                CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());
                return new ConfirmarAbonoResponseDTO(abono, cuenta, null);
            }
            throw new IllegalStateException("El abono ya fue procesado con estado: " + abono.getEstado());
        }

        CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());

        // Bloqueo temporal durante la acreditación
        cuenta.bloquearTemporalmente(30);

        abono.aprobar(dto.getToken());
        MovimientoSaldo mov = cuenta.acreditarMontoAbonado(abono);

        cuenta.desbloquear();

        cuenta = cuentaSaldoRepository.save(cuenta);
        abono = abonoRepository.save(abono);
        mov = movimientoSaldoRepository.save(mov);

        return new ConfirmarAbonoResponseDTO(abono, cuenta, mov);
    }

    @Transactional
    public MovimientoSaldoDTO retenerSaldo(RetenerSaldoDTO dto) {
        if (dto.getIdempotencyKey() != null && !dto.getIdempotencyKey().isBlank()
                && movimientoSaldoRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByIdempotencyKey(dto.getIdempotencyKey()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        MovimientoSaldo mov = cuenta.retenerSaldoPorReserva(dto.getMonto(), dto.getReservaId());
        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        return new MovimientoSaldoDTO(mov);
    }

    @Transactional
    public MovimientoSaldoDTO liberarSaldo(LiberarSaldoDTO dto) {
        if (dto.getIdempotencyKey() != null && !dto.getIdempotencyKey().isBlank()
                && movimientoSaldoRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByIdempotencyKey(dto.getIdempotencyKey()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        MovimientoSaldo mov = cuenta.liberarSaldoRetenido(dto.getMonto(), dto.getReservaId());
        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        return new MovimientoSaldoDTO(mov);
    }

    @Transactional
    public CobrarSaldoResponseDTO cobrarEntrega(CobrarSaldoDTO dto) {
        if (dto.getIdempotencyKey() != null && !dto.getIdempotencyKey().isBlank()
                && movimientoSaldoRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByIdempotencyKey(dto.getIdempotencyKey()).get();
            CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
            return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), false, prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        int saldoAnterior = cuenta.getSaldoActual();

        MovimientoSaldo mov = cuenta.cobrarEntregaMateriales(dto.getMonto(), dto.getEntregaId(), dto.isVieneDeReserva());
        boolean alertaSaldoBajo = cuenta.cruzoUmbralSaldoBajo(saldoAnterior, 3000);

        if (dto.getIdempotencyKey() != null) {
            mov.setIdempotencyKey(dto.getIdempotencyKey());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), alertaSaldoBajo, mov);
    }

    @Transactional
    public LiquidarSaldoResponseDTO liquidarSaldoPorRetiro(LiquidarSaldoDTO dto) {
        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        int saldoALiquidar = cuenta.getSaldoActual();

        MovimientoSaldo mov = cuenta.liquidarSaldoPorRetiro(dto.getApoderadoId(), dto.getMedio(), dto.getComprobante(), dto.getMotivo());

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        return new LiquidarSaldoResponseDTO(dto.getAlumnoId(), dto.getApoderadoId(), saldoALiquidar, mov);
    }

    @Transactional(readOnly = true)
    public List<MovimientoSaldoDTO> listarMovimientos(Long alumnoId) {
        CuentaSaldo cuenta = cuentaSaldoRepository.findByAlumnoId(alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta de saldo no encontrada para el alumno ID: " + alumnoId));

        return movimientoSaldoRepository.findByCuentaSaldoIdOrderByFechaDesc(cuenta.getId())
                .stream()
                .map(MovimientoSaldoDTO::new)
                .collect(Collectors.toList());
    }

    // --- Métodos de compatibilidad legacy ---

    @Transactional
    public MovimientoSaldoDTO comprometer(Long alumnoId, ComprometerSaldoDTO dto) {
        RetenerSaldoDTO ret = new RetenerSaldoDTO(alumnoId, dto.getMonto(), dto.getReservaId());
        ret.setUsuarioId(dto.getUsuarioId());
        ret.setIdempotencyKey(dto.getIdempotencyKey());
        return retenerSaldo(ret);
    }

    @Transactional
    public MovimientoSaldoDTO finalizarReserva(Long alumnoId, FinalizarReservaDTO dto) {
        CobrarSaldoDTO cob = new CobrarSaldoDTO(alumnoId, dto.getMonto(), dto.getVentaId(), true);
        cob.setIdempotencyKey(dto.getIdempotencyKey());
        CobrarSaldoResponseDTO res = cobrarEntrega(cob);
        MovimientoSaldo mov = movimientoSaldoRepository.findById(res.getMovimientoId()).orElse(null);
        return mov != null ? new MovimientoSaldoDTO(mov) : null;
    }

    @Transactional
    public MovimientoSaldoDTO liberar(Long alumnoId, int monto, Long reservaId, Long usuarioId, String idempotencyKey) {
        LiberarSaldoDTO lib = new LiberarSaldoDTO(alumnoId, monto, reservaId);
        lib.setUsuarioId(usuarioId);
        lib.setIdempotencyKey(idempotencyKey);
        return liberarSaldo(lib);
    }

    @Transactional
    public MovimientoSaldoDTO abonar(Long alumnoId, AbonarSaldoDTO dto) {
        if (dto.getIdempotencyKey() != null && movimientoSaldoRepository.existsByIdempotencyKey(dto.getIdempotencyKey())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByIdempotencyKey(dto.getIdempotencyKey()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(alumnoId);
        cuenta.abonar(dto.getMonto());
        cuenta = cuentaSaldoRepository.save(cuenta);

        MovimientoSaldo mov = new MovimientoSaldo(
                cuenta, TipoMovimientoSaldo.ABONO, dto.getMonto(), cuenta.getSaldoActual(),
                dto.getApoderadoId(), "Aporte de saldo vía Webpay simulado", dto.getIdempotencyKey()
        );
        mov = movimientoSaldoRepository.save(mov);
        return new MovimientoSaldoDTO(mov);
    }
}
