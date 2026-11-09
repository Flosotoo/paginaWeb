package cl.edusaldo.alumnos.service;

import cl.edusaldo.alumnos.client.UsuariosSaldosClient;
import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.exception.PagoExpiradoException;
import cl.edusaldo.alumnos.exception.ServicioUsuariosNoDisponibleException;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.*;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SaldoService {

  @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;

  private final CuentaSaldoRepository cuentaSaldoRepository;
  private final MovimientoSaldoRepository movimientoSaldoRepository;
  private final AbonoRepository abonoRepository;

  @Autowired(required = false)
  private UsuariosSaldosClient usuariosSaldosClient;

  @Autowired(required = false)
  private PagoWebpaySimuladoRepository pagoWebpaySimuladoRepository;

  @Autowired(required = false)
  private CompromisoSaldoRepository compromisoSaldoRepository;

  @Autowired(required = false)
  private ConstanciaDevolucionSaldoRepository constanciaDevolucionSaldoRepository;

  @Autowired(required = false)
  private AlertaSaldoBajoRepository alertaSaldoBajoRepository;

  @Autowired(required = false)
  private NotificacionSaldoPendienteRepository notificacionSaldoPendienteRepository;

  public SaldoService(
      CuentaSaldoRepository cuentaSaldoRepository,
      MovimientoSaldoRepository movimientoSaldoRepository,
      AbonoRepository abonoRepository) {
    this.cuentaSaldoRepository = cuentaSaldoRepository;
    this.movimientoSaldoRepository = movimientoSaldoRepository;
    this.abonoRepository = abonoRepository;
  }

  @Transactional
  public CuentaSaldo obtenerCuenta(Long alumnoId) {
    autorizarAlumno(alumnoId);
    CuentaSaldo cuenta =
        cuentaSaldoRepository
            .findByAlumnoIdAndIdEstablecimiento(alumnoId, RequestContext.tenant())
            .orElseGet(
                () -> {
                  CuentaSaldo nueva = new CuentaSaldo(alumnoId, 0, 0);
                  nueva.setIdEstablecimiento(RequestContext.tenant());
                  if (usuariosSaldosClient != null)
                    RequestContext.checkTenant(
                        usuariosSaldosClient.establecimientoAlumno(alumnoId));
                  return cuentaSaldoRepository.save(nueva);
                });
    if (entityManager != null) {
      entityManager.lock(cuenta, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
    }
    return cuenta;
  }

  @Transactional(readOnly = true)
  public CuentaSaldoResponseDTO consultarCuenta(Long alumnoId) {
    autorizarAlumno(alumnoId);
    CuentaSaldo cuenta =
        cuentaSaldoRepository
            .findByAlumnoIdAndIdEstablecimiento(alumnoId, RequestContext.tenant())
            .orElseGet(
                () -> {
                  CuentaSaldo nueva = new CuentaSaldo(alumnoId, 0, 0);
                  nueva.setIdEstablecimiento(RequestContext.tenant());
                  return nueva;
                });
    return new CuentaSaldoResponseDTO(cuenta);
  }

  @Transactional
  public IniciarAbonoResponseDTO iniciarAbono(IniciarAbonoDTO dto) {
    RequestContext.requireRoles("APODERADO", "ADMINISTRADOR");
    RequestContext.requireActor(dto.getApoderadoId());
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
      pagoWebpaySimuladoRepository.save(
          new PagoWebpaySimulado(abono.getId(), abono.getTokenTransaccion(), "PENDIENTE"));
    }
    return new IniciarAbonoResponseDTO(abono);
  }

  @Transactional(readOnly = true)
  public List<Abono> listarAbonos(Long alumnoId, EstadoAbono estado) {
    RequestContext.requireRoles("ADMINISTRADOR", "APODERADO");
    var contexto = RequestContext.current();
    java.util.Set<Long> alumnosVinculados = null;
    if ("APODERADO".equals(contexto.rol())) {
      alumnosVinculados = requerirUsuarios().alumnosVinculados(contexto.usuario());
      if (alumnoId != null && !alumnosVinculados.contains(alumnoId))
        throw new SecurityException("Alumno sin vínculo activo con el apoderado");
    } else if (alumnoId != null) autorizarAlumno(alumnoId);
    final java.util.Set<Long> alumnosAutorizados = alumnosVinculados;
    return abonoRepository.findAllByIdEstablecimiento(RequestContext.tenant()).stream()
        .filter(a -> alumnoId == null || alumnoId.equals(a.getAlumnoId()))
        .filter(a -> estado == null || estado == a.getEstado())
        .filter(
            a ->
                !"APODERADO".equals(RequestContext.current().rol())
                    || RequestContext.current().usuario().equals(a.getApoderadoId())
                        && alumnosAutorizados.contains(a.getAlumnoId()))
        .filter(
            a ->
                !"ALUMNO".equals(RequestContext.current().rol())
                    || RequestContext.current().usuario().equals(a.getAlumnoId()))
        .toList();
  }

  @Transactional
  public Map<String, Long> propietarioAbono(String token) {
    Abono a =
        abonoRepository
            .findByTokenTransaccionAndIdEstablecimiento(token, RequestContext.tenant())
            .orElseThrow(() -> new IllegalArgumentException("Abono inexistente"));
    RequestContext.checkTenant(a.getIdEstablecimiento());
    return Map.of("alumnoId", a.getAlumnoId(), "apoderadoId", a.getApoderadoId());
  }

  @Transactional(noRollbackFor = PagoExpiradoException.class)
  public ConfirmarAbonoResponseDTO confirmarAbono(ConfirmarAbonoDTO dto) {
    Abono abono =
        abonoRepository
            .findByTokenTransaccionAndIdEstablecimiento(dto.getToken(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Abono no encontrado con token: " + dto.getToken()));

    RequestContext.checkTenant(abono.getIdEstablecimiento());
    if (!"ADMINISTRADOR".equals(RequestContext.current().rol()))
      RequestContext.requireActor(abono.getApoderadoId());
    if (!java.util.Set.of("APROBADO", "RECHAZADO").contains(dto.getResultadoSimulado()))
      throw new IllegalArgumentException("Resultado de pago inválido");
    if (abono.getEstado() == EstadoAbono.APROBADO || abono.getEstado() == EstadoAbono.RECHAZADO) {
      return new ConfirmarAbonoResponseDTO(abono, obtenerCuenta(abono.getAlumnoId()), null);
    }
    if (!abono.estaVigente() || abono.getEstado() == EstadoAbono.EXPIRADO) {
      abonoRepository.save(abono);
      throw new PagoExpiradoException("El abono ha expirado");
    }
    if (abono.getEstado() != EstadoAbono.PENDIENTE)
      throw new IllegalStateException("El abono ya fue procesado");
    CuentaSaldo cuenta = obtenerCuenta(abono.getAlumnoId());
    abono.setCuentaSaldo(cuenta);

    cuenta.bloquearTemporalmente(30);

    if ("RECHAZADO".equals(dto.getResultadoSimulado())) {
      abono.rechazar(dto.getToken());
      cuenta.desbloquear();
      abonoRepository.save(abono);
      registrarResultadoPago(abono, "RECHAZADO");
      return new ConfirmarAbonoResponseDTO(abono, cuenta, null);
    }
    abono.aprobar(dto.getToken());
    MovimientoSaldo mov = cuenta.acreditarMontoAbonado(abono);

    cuenta.desbloquear();

    cuenta = cuentaSaldoRepository.save(cuenta);
    abono = abonoRepository.save(abono);
    mov = movimientoSaldoRepository.save(mov);
    rearmarAlertaSaldoBajoSiAplica(cuenta);
    if (pagoWebpaySimuladoRepository != null && abono.getId() != null) {
      pagoWebpaySimuladoRepository
          .findByAbonoId(abono.getId())
          .ifPresent(
              p -> {
                p.registrarResultado("APROBADO");
                pagoWebpaySimuladoRepository.save(p);
              });
    }

    return new ConfirmarAbonoResponseDTO(abono, cuenta, mov);
  }

  @Transactional
  public MovimientoSaldoDTO retenerSaldo(RetenerSaldoDTO dto) {
    autorizarAlumno(dto.getAlumnoId());
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("HOLD-" + dto.getReservaId());
    if (dto.getReferenciaUnica() != null
        && !dto.getReferenciaUnica().isBlank()
        && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoSaldo prev =
          movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).orElseThrow();
      validarRepeticion(
          prev, dto.getAlumnoId(), dto.getMonto(), TipoMovimientoSaldo.RESERVA, dto.getReservaId());
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
      compromisoSaldoRepository.save(
          new CompromisoSaldo(cuenta.getId(), dto.getReservaId(), dto.getMonto()));
    }
    return new MovimientoSaldoDTO(mov);
  }

  @Transactional
  public MovimientoSaldoDTO liberarSaldo(LiberarSaldoDTO dto) {
    autorizarAlumno(dto.getAlumnoId());
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("RELEASE-" + dto.getReservaId());
    if (dto.getReferenciaUnica() != null
        && !dto.getReferenciaUnica().isBlank()
        && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoSaldo prev =
          movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).orElseThrow();
      validarRepeticion(
          prev,
          dto.getAlumnoId(),
          dto.getMonto(),
          TipoMovimientoSaldo.LIBERACION_RESERVA,
          dto.getReservaId());
      return new MovimientoSaldoDTO(prev);
    }

    CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
    CompromisoSaldo compromiso = compromisoActivo(cuenta, dto.getReservaId(), dto.getMonto());
    MovimientoSaldo mov = cuenta.liberarSaldoRetenido(dto.getMonto(), dto.getReservaId());
    if (compromiso != null) {
      compromiso.liberar();
      compromisoSaldoRepository.save(compromiso);
    }
    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    cuenta = cuentaSaldoRepository.save(cuenta);
    mov = movimientoSaldoRepository.save(mov);
    return new MovimientoSaldoDTO(mov);
  }

  @Transactional
  public CobrarSaldoResponseDTO cobrarEntrega(CobrarSaldoDTO dto) {
    autorizarAlumno(dto.getAlumnoId());
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("CHARGE-" + dto.getEntregaId());
    if (dto.getReferenciaUnica() != null
        && !dto.getReferenciaUnica().isBlank()
        && movimientoSaldoRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoSaldo prev =
          movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica()).orElseThrow();
      validarRepeticion(
          prev, dto.getAlumnoId(), dto.getMonto(), TipoMovimientoSaldo.ENTREGA, dto.getEntregaId());
      CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
      return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), false, prev);
    }

    CuentaSaldo cuenta = obtenerCuenta(dto.getAlumnoId());
    int saldoAnterior = cuenta.getSaldoActual();

    CompromisoSaldo compromiso =
        dto.isVieneDeReserva()
            ? compromisoActivo(cuenta, dto.getReservaId(), dto.getMonto())
            : null;
    MovimientoSaldo mov =
        cuenta.cobrarEntregaMateriales(dto.getMonto(), dto.getEntregaId(), dto.isVieneDeReserva());
    mov.setEntregaId(dto.getEntregaId());
    if (compromiso != null) {
      compromiso.consumir();
      compromisoSaldoRepository.save(compromiso);
    }
    boolean alertaSaldoBajo =
        cuenta.cruzoUmbralSaldoBajo(saldoAnterior, RequestContext.current().umbralSaldoBajo());

    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    cuenta = cuentaSaldoRepository.save(cuenta);
    mov = movimientoSaldoRepository.save(mov);
    if (alertaSaldoBajoRepository != null && cuenta.getId() != null) {
      Long cId = cuenta.getId();
      java.util.Optional<AlertaSaldoBajo> alertaOpt =
          alertaSaldoBajoRepository.findByCuentaSaldoId(cId);
      boolean estabaActiva = alertaOpt.map(AlertaSaldoBajo::isActiva).orElse(false);

      if (cuenta.getSaldoDisponible() <= RequestContext.current().umbralSaldoBajo()) {
        AlertaSaldoBajo alerta =
            alertaOpt.orElseGet(
                () -> new AlertaSaldoBajo(cId, RequestContext.current().umbralSaldoBajo(), false));
        alerta.setUmbralAplicadoClp(RequestContext.current().umbralSaldoBajo());
        alerta.evaluar(cuenta.getSaldoDisponible());
        alerta = alertaSaldoBajoRepository.save(alerta);
        if (!estabaActiva
            && notificacionSaldoPendienteRepository != null
            && alerta.getId() != null) {
          notificacionSaldoPendienteRepository.save(
              new NotificacionSaldoPendiente(
                  alerta.getId(),
                  cuenta.getAlumnoId(),
                  "A03-SALDO-BAJO-" + UUID.randomUUID().toString().substring(0, 8)));
        }
      }
    }
    return new CobrarSaldoResponseDTO(cuenta, dto.getMonto(), alertaSaldoBajo, mov);
  }

  @Transactional
  public MovimientoSaldoDTO reintegrarPorDevolucion(ReintegrarSaldoDTO dto) {
    if (dto.getAlumnoId() == null || dto.getAlumnoId() <= 0
        || dto.getEntregaId() == null || dto.getEntregaId() <= 0
        || dto.getMonto() <= 0 || !dto.isOrigenValido()
        || (dto.getDevolucionId() != null && dto.getDevolucionId() <= 0)
        || (dto.getOperacionCompensacionId() != null && dto.getOperacionCompensacionId() <= 0))
      throw new IllegalArgumentException("Datos de reintegro inválidos");
    autorizarAlumno(dto.getAlumnoId());
    Long origenId = dto.getOperacionCompensacionId() != null
        ? dto.getOperacionCompensacionId() : dto.getDevolucionId();
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica((dto.getOperacionCompensacionId() == null ? "REFUND-" : "COMPENSACION-") + origenId);
    if (dto.getOperacionCompensacionId() != null
        && !dto.getReferenciaUnica().equals("COMPENSACION-" + origenId))
      throw new IllegalArgumentException("Referencia de compensación inválida");

    CuentaSaldo cuenta = cuentaSaldoRepository.buscarParaReintegro(dto.getAlumnoId(), RequestContext.tenant())
        .orElseThrow(() -> new IllegalStateException("No existe cuenta con un cobro para reintegrar"));
    var anterior = movimientoSaldoRepository.findByReferenciaUnica(dto.getReferenciaUnica());
    if (anterior.isPresent()) {
      MovimientoSaldo prev = anterior.get();
      validarRepeticion(prev, dto.getAlumnoId(), dto.getMonto(), TipoMovimientoSaldo.DEVOLUCION, origenId);
      if (!java.util.Objects.equals(prev.getEntregaId(), dto.getEntregaId())
          || !java.util.Objects.equals(prev.getOperacionCompensacionId(), dto.getOperacionCompensacionId()))
        throw new IllegalStateException("Referencia asociada a otra operación");
      return new MovimientoSaldoDTO(prev);
    }

    List<MovimientoSaldo> historial =
        movimientoSaldoRepository.findByCuentaSaldoIdOrderByFechaDesc(cuenta.getId());
    int cobrado =
        historial.stream()
            .filter(
                m ->
                    dto.getEntregaId().equals(m.getEntregaId())
                        && m.getTipo() == TipoMovimientoSaldo.ENTREGA)
            .map(MovimientoSaldo::getMonto)
            .reduce(0, Math::addExact);
    int reintegrado =
        historial.stream()
            .filter(
                m ->
                    dto.getEntregaId().equals(m.getEntregaId())
                        && m.getTipo() == TipoMovimientoSaldo.DEVOLUCION)
            .map(MovimientoSaldo::getMonto)
            .reduce(0, Math::addExact);
    if (dto.getMonto() > Math.subtractExact(cobrado, reintegrado))
      throw new IllegalStateException(
          "El reintegro supera el cobro pendiente de devolver de la entrega");
    MovimientoSaldo mov = cuenta.reembolsarPorDevolucion(dto.getMonto(), origenId);
    mov.setEntregaId(dto.getEntregaId());
    mov.setOperacionCompensacionId(dto.getOperacionCompensacionId());
    if (dto.getOperacionCompensacionId() != null)
      mov.setDescripcion("Reintegro por compensación de operación #" + origenId);
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
    RequestContext.requireRoles("ADMINISTRADOR");
    if (dto.getAlumnoId() == null || dto.getAlumnoId() <= 0 || dto.getApoderadoId() == null
        || dto.getApoderadoId() <= 0 || dto.getComprobante() == null || dto.getComprobante().isBlank()
        || dto.getComprobante().length() > 100 || dto.getMedio() == null || dto.getMedio().isBlank()
        || dto.getMedio().length() > 50 || dto.getMotivo() == null || dto.getMotivo().isBlank()
        || dto.getMotivo().length() > 255)
      throw new IllegalArgumentException("Datos de liquidación inválidos");
    requerirUsuarios().validarAlumnoYVinculo(dto.getAlumnoId(), dto.getApoderadoId());
    if (constanciaDevolucionSaldoRepository == null)
      throw new IllegalStateException("No está disponible el registro de constancias");
    CuentaSaldo cuenta = cuentaSaldoRepository
        .buscarParaReintegro(dto.getAlumnoId(), RequestContext.tenant())
        .orElseThrow(() -> new IllegalArgumentException("Cuenta de saldo no encontrada"));
    String referencia = dto.getComprobante().trim();
    if (constanciaDevolucionSaldoRepository.existsByCuentaSaldoIdAndReferencia(cuenta.getId(), referencia))
      throw new IllegalStateException("El comprobante ya fue registrado para esta cuenta");
    int saldoALiquidar = cuenta.getSaldoActual();

    MovimientoSaldo mov =
        cuenta.liquidarSaldoPorRetiro(
            dto.getApoderadoId(), dto.getMedio(), referencia, dto.getMotivo());

    cuenta = cuentaSaldoRepository.save(cuenta);
    mov = movimientoSaldoRepository.save(mov);
    if (cuenta.getId() == null || mov.getId() == null)
      throw new IllegalStateException("No fue posible registrar la constancia");
    constanciaDevolucionSaldoRepository.save(
          new ConstanciaDevolucionSaldo(
              cuenta.getId(),
              mov.getId(),
              RequestContext.current().usuario(),
              dto.getApoderadoId(),
              saldoALiquidar,
              dto.getMedio(),
              referencia,
              dto.getMotivo()));
    return new LiquidarSaldoResponseDTO(
        dto.getAlumnoId(), dto.getApoderadoId(), saldoALiquidar, mov);
  }

  @Transactional(readOnly = true)
  public List<MovimientoSaldoDTO> listarMovimientos(Long alumnoId) {
    autorizarAlumno(alumnoId);
    CuentaSaldo cuenta =
        cuentaSaldoRepository
            .findByAlumnoIdAndIdEstablecimiento(alumnoId, RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Cuenta de saldo no encontrada para el alumno ID: " + alumnoId));

    return movimientoSaldoRepository.findByCuentaSaldoIdOrderByFechaDesc(cuenta.getId()).stream()
        .map(MovimientoSaldoDTO::new)
        .collect(Collectors.toList());
  }

  @Transactional(readOnly = true)
  public List<ConstanciaAuditoriaDTO> listarConstancias() {
    RequestContext.requireRoles("ADMINISTRADOR");
    return constanciaDevolucionSaldoRepository.listarPorEstablecimiento(RequestContext.tenant()).stream()
        .map(c -> new ConstanciaAuditoriaDTO(c.getId(), c.getCuentaSaldo().getAlumnoId(), c.getAdministradorId(), c.getMontoClp(), c.getFechaEntregaDinero()))
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ReporteCuentaDTO> reportePorAlumno(LocalDate desde, LocalDate hasta) {
    RequestContext.requireRoles("ADMINISTRADOR");
    if (desde == null || hasta == null || desde.isAfter(hasta) || hasta.equals(LocalDate.MAX))
      throw new IllegalArgumentException("Rango de fechas inválido");
    Long establecimiento = RequestContext.tenant();
    var movimientos = movimientoSaldoRepository.buscarPeriodo(
        establecimiento, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()).stream()
        .collect(Collectors.groupingBy(MovimientoSaldo::getCuentaSaldoId));
    return cuentaSaldoRepository.findAllByIdEstablecimiento(establecimiento).stream()
        .map(c -> new ReporteCuentaDTO(new CuentaSaldoResponseDTO(c),
            movimientos.getOrDefault(c.getId(), List.of()).stream().map(MovimientoSaldoDTO::new).toList()))
        .toList();
  }

  @Transactional(readOnly = true)
  public Map<String, Object> obtenerResumenPeriodo(
      Long establecimiento, LocalDate desde, LocalDate hasta) {
    RequestContext.requireRoles("ADMINISTRADOR");
    RequestContext.checkTenant(establecimiento);
    if (desde == null || hasta == null || desde.isAfter(hasta) || hasta.equals(LocalDate.MAX))
      throw new IllegalArgumentException("Rango de fechas inválido");
    List<CuentaSaldo> cuentas = cuentaSaldoRepository.findAllByIdEstablecimiento(establecimiento);
    List<MovimientoSaldo> movimientos =
        movimientoSaldoRepository.buscarPeriodo(
            establecimiento, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay());
    int totalSaldoActual =
        cuentas.stream().map(CuentaSaldo::getSaldoActual).reduce(0, Math::addExact);
    int totalSaldoComprometido =
        cuentas.stream().map(CuentaSaldo::getSaldoComprometido).reduce(0, Math::addExact);
    int totalAbonado =
        movimientos.stream()
            .filter(m -> m.getTipo() == TipoMovimientoSaldo.ABONO)
            .map(MovimientoSaldo::getMonto)
            .reduce(0, Math::addExact);
    int totalEntregado =
        movimientos.stream()
            .filter(m -> m.getTipo() == TipoMovimientoSaldo.ENTREGA)
            .map(MovimientoSaldo::getMonto)
            .reduce(0, Math::addExact);
    int totalReintegrado =
        movimientos.stream()
            .filter(m -> m.getTipo() == TipoMovimientoSaldo.DEVOLUCION)
            .map(MovimientoSaldo::getMonto)
            .reduce(0, Math::addExact);
    Map<String, Object> resumen = new LinkedHashMap<>();
    resumen.put("idEstablecimiento", establecimiento);
    resumen.put("totalCuentas", cuentas.size());
    resumen.put("totalSaldoActual", totalSaldoActual);
    resumen.put("totalSaldoComprometido", totalSaldoComprometido);
    resumen.put(
        "totalSaldoDisponible", Math.subtractExact(totalSaldoActual, totalSaldoComprometido));
    resumen.put("totalAbonadoPeriodo", totalAbonado);
    resumen.put("totalEntregasPeriodo", totalEntregado);
    resumen.put("totalReintegrosDevolucion", totalReintegrado);
    return resumen;
  }

  private void rearmarAlertaSaldoBajoSiAplica(CuentaSaldo cuenta) {
    if (alertaSaldoBajoRepository != null
        && cuenta != null
        && cuenta.getId() != null
        && cuenta.getSaldoDisponible() > RequestContext.current().umbralSaldoBajo()) {
      alertaSaldoBajoRepository
          .findByCuentaSaldoId(cuenta.getId())
          .ifPresent(
              alerta -> {
                if (alerta.isActiva()) {
                  alerta.reactivar();
                  alertaSaldoBajoRepository.save(alerta);
                }
              });
    }
  }

  private void autorizarAlumno(Long alumnoId) {
    RequestContext c = RequestContext.current();
    if ("ALUMNO".equals(c.rol()) && !c.usuario().equals(alumnoId))
      throw new SecurityException("Alumno no autorizado");
    if (usuariosSaldosClient != null)
      usuariosSaldosClient.validarAlumnoYVinculo(
          alumnoId, "APODERADO".equals(c.rol()) ? c.usuario() : null);
  }

  private void validarRepeticion(
      MovimientoSaldo movimiento,
      Long alumnoId,
      int monto,
      TipoMovimientoSaldo tipo,
      Long referenciaId) {
    CuentaSaldo cuenta = movimiento.getCuentaSaldo();
    if (cuenta == null) throw new IllegalStateException("Movimiento sin cuenta");
    RequestContext.checkTenant(cuenta.getIdEstablecimiento());
    if (!alumnoId.equals(cuenta.getAlumnoId())
        || movimiento.getMonto() != monto
        || movimiento.getTipo() != tipo
        || !java.util.Objects.equals(referenciaId, movimiento.getReferenciaId()))
      throw new IllegalStateException("Referencia asociada a otra operación");
  }

  private CompromisoSaldo compromisoActivo(CuentaSaldo cuenta, Long reservaId, int monto) {
    if (reservaId == null)
      throw new IllegalArgumentException(
          "reservaId es obligatorio para consumir o liberar un compromiso");
    if (compromisoSaldoRepository == null) return null;
    List<CompromisoSaldo> compromisos =
        compromisoSaldoRepository.findByCuentaAndReserva(cuenta.getId(), reservaId);
    if (compromisos.size() != 1)
      throw new IllegalStateException("Compromiso de reserva no encontrado");
    CompromisoSaldo compromiso = compromisos.get(0);
    if (!"COMPROMETIDO".equals(compromiso.getEstado()) || compromiso.getMontoClp() != monto)
      throw new IllegalStateException(
          "El compromiso no coincide con la reserva o ya fue consumido");
    return compromiso;
  }

  private void registrarResultadoPago(Abono abono, String resultado) {
    if (pagoWebpaySimuladoRepository != null && abono.getId() != null)
      pagoWebpaySimuladoRepository
          .findByAbonoId(abono.getId())
          .ifPresent(
              p -> {
                p.registrarResultado(resultado);
                pagoWebpaySimuladoRepository.save(p);
              });
  }

  @Transactional(readOnly = true)
  public List<Map<String, Object>> listarNotificaciones() {
    RequestContext contexto = RequestContext.current();
    RequestContext.requireRoles("ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO");
    UsuariosSaldosClient usuarios = requerirUsuarios();
    java.util.Set<Long> alumnosAutorizados =
        "APODERADO".equals(contexto.rol())
            ? usuarios.alumnosVinculados(contexto.usuario())
            : java.util.Set.of();
    return notificacionSaldoPendienteRepository
        .buscarPorEstablecimiento(contexto.establecimiento())
        .stream()
        .filter(n -> !"ALUMNO".equals(contexto.rol()) || contexto.usuario().equals(n.getAlumnoId()))
        .filter(
            n ->
                !"APODERADO".equals(contexto.rol())
                    || alumnosAutorizados.contains(n.getAlumnoId()))
        .map(
            n -> {
              Map<String, Object> item = new LinkedHashMap<>();
              item.put("id", n.getId());
              item.put("alumnoId", n.getAlumnoId());
              item.put("estado", n.getEstado());
              item.put("claveEvento", n.getClaveEvento());
              item.put("contenido", n.getContenido());
              try {
                boolean staff = "ADMINISTRADOR".equals(contexto.rol()) || "ENCARGADO".equals(contexto.rol());
                item.put("destinatarios", !staff || n.getDestinatariosJson() == null ? java.util.List.of()
                    : new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        n.getDestinatariosJson(), java.util.List.class));
              } catch (com.fasterxml.jackson.core.JsonProcessingException ex) {
                throw new IllegalStateException("Destinatarios guardados inválidos", ex);
              }
              return item;
            })
        .toList();
  }

  @Transactional
  public void recuperarNotificacion(Long id) {
    RequestContext.requireRoles("ADMINISTRADOR", "ENCARGADO");
    var notificacion = notificacionSaldoPendienteRepository.bloquear(id)
        .orElseThrow(() -> new IllegalArgumentException("Notificación no encontrada"));
    RequestContext.checkTenant(notificacion.getAlertaSaldoBajo().getCuentaSaldo().getIdEstablecimiento());
    notificacion.recuperar();
  }

  private UsuariosSaldosClient requerirUsuarios() {
    if (usuariosSaldosClient == null) throw new ServicioUsuariosNoDisponibleException();
    return usuariosSaldosClient;
  }
}
