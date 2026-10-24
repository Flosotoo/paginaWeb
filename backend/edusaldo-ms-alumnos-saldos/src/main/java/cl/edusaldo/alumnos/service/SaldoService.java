package cl.edusaldo.alumnos.service;

import cl.edusaldo.alumnos.client.UsuariosSaldosClient;
import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SaldoService {

    private final CuentaSaldoRepository cuentaSaldoRepository;
    private final MovimientoSaldoRepository movimientoSaldoRepository;
    private final AbonoRepository abonoRepository;

    @Autowired(required = false)
    private UsuariosSaldosClient usuariosSaldosClient;

    @Autowired(required = false)
    private PagoWebpaySimuladoRepository pagoWebpaySimuladoRepository;

    @Autowired(required = false)
    private TransferenciaBancariaRepository transferenciaBancariaRepository;

    @Autowired(required = false)
    private CompromisoSaldoRepository compromisoSaldoRepository;

    @Autowired(required = false)
    private ConstanciaDevolucionSaldoRepository constanciaDevolucionSaldoRepository;

    @Autowired(required = false)
    private AlertaSaldoBajoRepository alertaSaldoBajoRepository;

    @Autowired(required = false)
    private NotificacionSaldoPendienteRepository notificacionSaldoPendienteRepository;

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
        if (usuariosSaldosClient != null) {
            usuariosSaldosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getApoderadoId());
        }
        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());

        Abono abono = Abono.iniciar(dto.getApoderadoId(), dto.getAlumnoId(), dto.getMonto());
        abono.setCuentaSaldo(cuenta);
        abono.setIdEstablecimiento(cuenta.getIdEstablecimiento());
        abono = abonoRepository.save(abono);
        if (pagoWebpaySimuladoRepository != null && abono.getId() != null) {
            pagoWebpaySimuladoRepository.save(new PagoWebpaySimulado(
                    abono.getId(), abono.getTokenTransaccion(), "PENDIENTE"));
        }
        return new IniciarAbonoResponseDTO(abono);
    }

    @Transactional
    public Abono registrarTransferencia(RegistrarTransferenciaDTO dto) {
        if (dto.getMonto() <= 0) {
            throw new IllegalArgumentException("El monto de la transferencia debe ser mayor a 0");
        }
        if (usuariosSaldosClient != null) {
            usuariosSaldosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getApoderadoId());
        }
        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        Abono abono = Abono.registrarTransferencia(
                cuenta,
                dto.getApoderadoId(),
                dto.getAlumnoId(),
                dto.getMonto(),
                dto.getFechaTransferencia(),
                dto.getComprobanteUrl(),
                dto.getNumeroOperacion()
        );
        abono = abonoRepository.save(abono);
        if (transferenciaBancariaRepository != null && abono.getId() != null) {
            transferenciaBancariaRepository.save(new TransferenciaBancaria(
                    abono.getId(), abono.getFechaTransferencia(), abono.getComprobanteUrl()));
        }
        return abono;
    }

    @Transactional
    public ConfirmarAbonoResponseDTO resolverTransferencia(Long abonoId, ResolverTransferenciaDTO dto) {
        Abono abono = abonoRepository.findById(abonoId)
                .orElseThrow(() -> new IllegalArgumentException("Abono por transferencia no encontrado con ID: " + abonoId));

        if (usuariosSaldosClient != null) {
            usuariosSaldosClient.validarAutorizacionCentroPadres(dto.getRevisorApoderadoId());
        }

        CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());
        abono.setCuentaSaldo(cuenta);

        if (Boolean.TRUE.equals(dto.getAprobar())) {
            cuenta.bloquearTemporalmente(30);
            abono.aprobarTransferencia(dto.getRevisorApoderadoId());
            MovimientoSaldo mov = cuenta.acreditarMontoAbonado(abono);
            cuenta.desbloquear();

            cuenta = cuentaSaldoRepository.save(cuenta);
            abono = abonoRepository.save(abono);
            mov = movimientoSaldoRepository.save(mov);
            rearmarAlertaSaldoBajoSiAplica(cuenta);
            if (transferenciaBancariaRepository != null && abono.getId() != null) {
                transferenciaBancariaRepository.findByAbonoId(abono.getId()).ifPresent(t -> {
                    t.aprobar(dto.getRevisorApoderadoId());
                    transferenciaBancariaRepository.save(t);
                });
            }
            return new ConfirmarAbonoResponseDTO(abono, cuenta, mov);
        } else {
            String motivo = (dto.getMotivoRechazo() != null && !dto.getMotivoRechazo().isBlank())
                    ? dto.getMotivoRechazo() : "Rechazado en conciliación bancaria del Centro de Padres";
            abono.rechazarTransferencia(dto.getRevisorApoderadoId(), motivo);
            abono = abonoRepository.save(abono);
            if (transferenciaBancariaRepository != null && abono.getId() != null) {
                transferenciaBancariaRepository.findByAbonoId(abono.getId()).ifPresent(t -> {
                    t.rechazar(dto.getRevisorApoderadoId(), motivo);
                    transferenciaBancariaRepository.save(t);
                });
            }
            return new ConfirmarAbonoResponseDTO(abono, cuenta, null);
        }
    }

    @Transactional(readOnly = true)
    public List<Abono> listarAbonos(Long alumnoId, EstadoAbono estado) {
        if (alumnoId != null) {
            return abonoRepository.findByAlumnoId(alumnoId);
        }
        if (estado != null) {
            return abonoRepository.findByEstado(estado);
        }
        return abonoRepository.findAll();
    }

    @Transactional
    public ConfirmarAbonoResponseDTO confirmarAbono(ConfirmarAbonoDTO dto) {
        Abono abono = abonoRepository.findByTokenTransaccion(dto.getToken())
                .or(() -> pagoWebpaySimuladoRepository != null
                        ? pagoWebpaySimuladoRepository.findByReferenciaPago(dto.getToken())
                                .flatMap(p -> abonoRepository.findById(p.getAbonoId()))
                        : java.util.Optional.empty())
                .orElseThrow(() -> new IllegalArgumentException("Abono no encontrado con token: " + dto.getToken()));

        if (!abono.estaVigente()) {
            abonoRepository.save(abono);
            throw new IllegalStateException("El abono ha expirado o no está vigente.");
        }

        if (abono.getEstado() != EstadoAbono.PENDIENTE) {
            if (abono.getEstado() == EstadoAbono.APROBADO) {
                CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());
                return new ConfirmarAbonoResponseDTO(abono, cuenta, null);
            }
            throw new IllegalStateException("El abono ya fue procesado con estado: " + abono.getEstado());
        }

        CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());
        abono.setCuentaSaldo(cuenta);

        cuenta.bloquearTemporalmente(30);

        abono.aprobar(dto.getToken());
        MovimientoSaldo mov = cuenta.acreditarMontoAbonado(abono);

        cuenta.desbloquear();

        cuenta = cuentaSaldoRepository.save(cuenta);
        abono = abonoRepository.save(abono);
        mov = movimientoSaldoRepository.save(mov);
        rearmarAlertaSaldoBajoSiAplica(cuenta);
        if (pagoWebpaySimuladoRepository != null && abono.getId() != null) {
            pagoWebpaySimuladoRepository.findByAbonoId(abono.getId()).ifPresent(p -> {
                p.registrarResultado("APROBADO");
                pagoWebpaySimuladoRepository.save(p);
            });
        }

        return new ConfirmarAbonoResponseDTO(abono, cuenta, mov);
    }

    @Transactional
    public MovimientoSaldoDTO retenerSaldo(RetenerSaldoDTO dto) {
        if (dto.getReferenciaUnica() != null && !dto.getReferenciaUnica().isBlank()
                && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        MovimientoSaldo mov = cuenta.retenerSaldoPorReserva(dto.getMonto(), dto.getReservaId());
        if (dto.getReferenciaUnica() != null) {
            mov.setReferenciaUnica(dto.getReferenciaUnica());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        if (compromisoSaldoRepository != null && cuenta.getId() != null && dto.getReservaId() != null) {
            compromisoSaldoRepository.save(new CompromisoSaldo(cuenta.getId(), dto.getReservaId(), dto.getMonto()));
        }
        return new MovimientoSaldoDTO(mov);
    }

    @Transactional
    public MovimientoSaldoDTO liberarSaldo(LiberarSaldoDTO dto) {
        if (dto.getReferenciaUnica() != null && !dto.getReferenciaUnica().isBlank()
                && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        MovimientoSaldo mov = cuenta.liberarSaldoRetenido(dto.getMonto(), dto.getReservaId());
        if (dto.getReferenciaUnica() != null) {
            mov.setReferenciaUnica(dto.getReferenciaUnica());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        if (compromisoSaldoRepository != null && cuenta.getId() != null && dto.getReservaId() != null) {
            compromisoSaldoRepository.findByCuentaAndReserva(cuenta.getId(), dto.getReservaId())
                    .forEach(c -> {
                        c.liberar();
                        compromisoSaldoRepository.save(c);
                    });
        }
        return new MovimientoSaldoDTO(mov);
    }

    @Transactional
    public CobrarSaldoResponseDTO cobrarEntrega(CobrarSaldoDTO dto) {
        if (dto.getReferenciaUnica() != null && !dto.getReferenciaUnica().isBlank()
                && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).get();
            CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
            return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), false, prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        int saldoAnterior = cuenta.getSaldoActual();

        MovimientoSaldo mov = cuenta.cobrarEntregaMateriales(dto.getMonto(), dto.getEntregaId(), dto.isVieneDeReserva());
        boolean alertaSaldoBajo = cuenta.cruzoUmbralSaldoBajo(saldoAnterior, 3000);

        if (dto.getReferenciaUnica() != null) {
            mov.setReferenciaUnica(dto.getReferenciaUnica());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        if (alertaSaldoBajoRepository != null && cuenta.getId() != null) {
            Long cId = cuenta.getId();
            java.util.Optional<AlertaSaldoBajo> alertaOpt = alertaSaldoBajoRepository.findByCuentaSaldoId(cId);
            boolean estabaActiva = alertaOpt.map(AlertaSaldoBajo::isActiva).orElse(false);

            if (cuenta.getSaldoDisponible() <= 3000) {
                AlertaSaldoBajo alerta = alertaOpt.orElseGet(() -> new AlertaSaldoBajo(cId, 3000, false));
                alerta.evaluar(cuenta.getSaldoDisponible());
                alerta = alertaSaldoBajoRepository.save(alerta);
                if (!estabaActiva && notificacionSaldoPendienteRepository != null && alerta.getId() != null) {
                    notificacionSaldoPendienteRepository.save(new NotificacionSaldoPendiente(
                            alerta.getId(), cuenta.getAlumnoId(), "A03-SALDO-BAJO-" + UUID.randomUUID().toString().substring(0, 8)));
                }
            }
        }
        return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), alertaSaldoBajo, mov);
    }

    @Transactional
    public MovimientoSaldoDTO reintegrarPorDevolucion(ReintegrarSaldoDTO dto) {
        if (dto.getReferenciaUnica() != null && !dto.getReferenciaUnica().isBlank()
                && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        MovimientoSaldo mov = cuenta.reembolsarPorDevolucion(dto.getMonto(), dto.getDevolucionId());
        if (dto.getReferenciaUnica() != null) {
            mov.setReferenciaUnica(dto.getReferenciaUnica());
        }

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        rearmarAlertaSaldoBajoSiAplica(cuenta);
        return new MovimientoSaldoDTO(mov);
    }

    @Transactional
    public LiquidarSaldoResponseDTO liquidarSaldoPorRetiro(LiquidarSaldoDTO dto) {
        CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
        int saldoALiquidar = cuenta.getSaldoActual();

        String refComprobante = dto.getComprobante();
        if (dto.getComprobanteDevolucionUrl() != null && !dto.getComprobanteDevolucionUrl().isBlank()) {
            refComprobante = refComprobante + " (" + dto.getComprobanteDevolucionUrl() + ")";
        }

        MovimientoSaldo mov = cuenta.liquidarSaldoPorRetiro(dto.getApoderadoId(), dto.getMedio(), refComprobante, dto.getMotivo());

        cuenta = cuentaSaldoRepository.save(cuenta);
        mov = movimientoSaldoRepository.save(mov);
        if (constanciaDevolucionSaldoRepository != null && cuenta.getId() != null && mov.getId() != null) {
            String ref = dto.getComprobante() != null && !dto.getComprobante().isBlank()
                    ? dto.getComprobante() + "-" + mov.getId()
                    : "DEV-SALDO-" + mov.getId();
            constanciaDevolucionSaldoRepository.save(new ConstanciaDevolucionSaldo(
                    cuenta.getId(), mov.getId(), 1L, dto.getApoderadoId(), saldoALiquidar,
                    dto.getMedio(), ref, dto.getMotivo()
            ));
        }
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

    @Transactional(readOnly = true)
    public Map<String, Object> obtenerResumenPeriodo() {
        List<CuentaSaldo> cuentas = cuentaSaldoRepository.findAll();
        List<MovimientoSaldo> movimientos = movimientoSaldoRepository.findAll();

        int totalSaldoActual = cuentas.stream().mapToInt(CuentaSaldo::getSaldoActual).sum();
        int totalSaldoComprometido = cuentas.stream().mapToInt(CuentaSaldo::getSaldoComprometido).sum();
        int totalAbonado = movimientos.stream()
                .filter(m -> m.getTipo() == TipoMovimientoSaldo.ABONO)
                .mapToInt(MovimientoSaldo::getMonto).sum();
        int totalEntregado = movimientos.stream()
                .filter(m -> m.getTipo() == TipoMovimientoSaldo.ENTREGA)
                .mapToInt(MovimientoSaldo::getMonto).sum();
        int totalReintegrado = movimientos.stream()
                .filter(m -> m.getTipo() == TipoMovimientoSaldo.DEVOLUCION)
                .mapToInt(MovimientoSaldo::getMonto).sum();

        Map<String, Object> resumen = new LinkedHashMap<>();
        resumen.put("idEstablecimiento", 1L);
        resumen.put("totalCuentas", cuentas.size());
        resumen.put("totalSaldoActual", totalSaldoActual);
        resumen.put("totalSaldoComprometido", totalSaldoComprometido);
        resumen.put("totalSaldoDisponible", totalSaldoActual - totalSaldoComprometido);
        resumen.put("totalAbonadoPeriodo", totalAbonado);
        resumen.put("totalEntregasPeriodo", totalEntregado);
        resumen.put("totalReintegrosDevolucion", totalReintegrado);
        return resumen;
    }

    @Transactional
    public MovimientoSaldoDTO comprometer(Long alumnoId, ComprometerSaldoDTO dto) {
        RetenerSaldoDTO ret = new RetenerSaldoDTO(alumnoId, dto.getMonto(), dto.getReservaId());
        ret.setUsuarioId(dto.getUsuarioId());
        ret.setReferenciaUnica(dto.getReferenciaUnica());
        return retenerSaldo(ret);
    }

    @Transactional
    public MovimientoSaldoDTO finalizarReserva(Long alumnoId, FinalizarReservaDTO dto) {
        CobrarSaldoDTO cob = new CobrarSaldoDTO(alumnoId, dto.getMonto(), dto.getVentaId(), true);
        cob.setReferenciaUnica(dto.getReferenciaUnica());
        CobrarSaldoResponseDTO res = cobrarEntrega(cob);
        MovimientoSaldo mov = movimientoSaldoRepository.findById(res.getMovimientoId()).orElse(null);
        return mov != null ? new MovimientoSaldoDTO(mov) : null;
    }

    @Transactional
    public MovimientoSaldoDTO liberar(Long alumnoId, int monto, Long reservaId, Long usuarioId, String referenciaUnica) {
        LiberarSaldoDTO lib = new LiberarSaldoDTO(alumnoId, monto, reservaId);
        lib.setUsuarioId(usuarioId);
        lib.setReferenciaUnica(referenciaUnica);
        return liberarSaldo(lib);
    }

    @Transactional
    public MovimientoSaldoDTO abonar(Long alumnoId, AbonarSaldoDTO dto) {
        if (dto.getReferenciaUnica() != null && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
            MovimientoSaldo prev = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).get();
            return new MovimientoSaldoDTO(prev);
        }

        CuentaSaldo cuenta = obtenerCuenta(alumnoId);
        cuenta.abonar(dto.getMonto());
        cuenta = cuentaSaldoRepository.save(cuenta);

        MovimientoSaldo mov = new MovimientoSaldo(
                cuenta, TipoMovimientoSaldo.ABONO, dto.getMonto(), cuenta.getSaldoActual(),
                dto.getApoderadoId(), "Aporte de saldo vía Webpay simulado", dto.getReferenciaUnica()
        );
        mov = movimientoSaldoRepository.save(mov);
        return new MovimientoSaldoDTO(mov);
    }
    private void rearmarAlertaSaldoBajoSiAplica(CuentaSaldo cuenta) {
        if (alertaSaldoBajoRepository != null && cuenta != null && cuenta.getId() != null && cuenta.getSaldoDisponible() > 3000) {
            alertaSaldoBajoRepository.findByCuentaSaldoId(cuenta.getId()).ifPresent(alerta -> {
                if (alerta.isActiva()) {
                    alerta.reactivar();
                    alertaSaldoBajoRepository.save(alerta);
                }
            });
        }
    }
}