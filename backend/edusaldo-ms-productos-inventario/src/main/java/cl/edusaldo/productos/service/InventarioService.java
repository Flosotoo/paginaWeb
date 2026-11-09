package cl.edusaldo.productos.service;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.repository.*;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InventarioService {
  @jakarta.persistence.PersistenceContext private jakarta.persistence.EntityManager entityManager;

  private final ProductoRepository productoRepository;
  private final MovimientoInventarioRepository movimientoInventarioRepository;
  private final SolicitudAjusteStockRepository solicitudAjusteStockRepository;
  private final IngresoStockRepository ingresoStockRepository;

  @Autowired(required = false)
  private ConteoFisicoRepository conteoFisicoRepository;

  @Autowired(required = false)
  private ReservaStockRepository reservaStockRepository;

  public InventarioService(
      ProductoRepository productoRepository,
      MovimientoInventarioRepository movimientoInventarioRepository,
      SolicitudAjusteStockRepository solicitudAjusteStockRepository,
      IngresoStockRepository ingresoStockRepository) {
    this.productoRepository = productoRepository;
    this.movimientoInventarioRepository = movimientoInventarioRepository;
    this.solicitudAjusteStockRepository = solicitudAjusteStockRepository;
    this.ingresoStockRepository = ingresoStockRepository;
  }

  @Transactional
  public IngresoStock registrarIngresoManual(IngresoManualDTO dto) {
    RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
    RequestContext.requireActor(dto.getEncargadoId());
    IngresoStock ingreso =
        new IngresoStock(dto.getEncargadoId(), dto.getReferenciaUnica(), dto.getObservacion());

    ingreso.setIdEstablecimiento(RequestContext.tenant());
    ingreso = ingresoStockRepository.save(ingreso);

    for (DetalleIngresoDTO det : dto.getDetalles()) {
      Producto p =
          productoRepository
              .findByIdAndIdEstablecimiento(det.getProductoId(), RequestContext.tenant())
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Producto no encontrado con ID: " + det.getProductoId()));
      if (entityManager != null)
        entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

      MovimientoInventario mov =
          p.ingresarStockManual(det.getCantidad(), ingreso.getId(), dto.getEncargadoId());
      productoRepository.save(p);
      movimientoInventarioRepository.save(mov);

      ingreso.agregarDetalle(p, det.getCantidad());
    }

    return ingresoStockRepository.save(ingreso);
  }

  @Transactional
  public ConteoFisico registrarConteoFisico(ConteoFisicoDTO dto) {
    RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
    RequestContext.requireActor(dto.getEncargadoId());
    ConteoFisico conteo = new ConteoFisico(dto.getEncargadoId(), dto.getObservaciones());
    conteo.setIdEstablecimiento(RequestContext.tenant());

    for (DetalleConteoDTO det : dto.getDetalles()) {
      Producto p =
          productoRepository
              .findByIdAndIdEstablecimiento(det.getProductoId(), RequestContext.tenant())
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Producto no encontrado con ID: " + det.getProductoId()));
      if (entityManager != null)
        entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
      conteo.agregarDetalle(p, det.getStockContado());
    }

    return conteoFisicoRepository != null ? conteoFisicoRepository.save(conteo) : conteo;
  }

  @Transactional(readOnly = true)
  public List<ConteoFisico> listarConteosFisicos() {
    return conteoFisicoRepository != null
        ? conteoFisicoRepository.findAllByIdEstablecimiento(RequestContext.tenant()).stream()
            .sorted(java.util.Comparator.comparing(ConteoFisico::getFechaConteo).reversed())
            .toList()
        : List.of();
  }

  @Transactional
  public SolicitudAjusteStock solicitarAjuste(SolicitarAjusteDTO dto) {
    RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
    RequestContext.requireActor(dto.getEncargadoId());
    Producto p =
        productoRepository
            .findByIdAndIdEstablecimiento(dto.getProductoId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Producto no encontrado con ID: " + dto.getProductoId()));
    if (entityManager != null)
      entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

    if (dto.getCantidad() == null || dto.getCantidad() == 0) {
      throw new IllegalArgumentException("La cantidad de ajuste no puede ser cero.");
    }

    SolicitudAjusteStock sol =
        new SolicitudAjusteStock(p, dto.getCantidad(), dto.getMotivo(), dto.getEncargadoId());

    return solicitudAjusteStockRepository.save(sol);
  }

  @Transactional(readOnly = true)
  public List<SolicitudAjusteStock> listarSolicitudesAjuste() {
    return solicitudAjusteStockRepository.findAllByIdEstablecimiento(RequestContext.tenant());
  }

  @Transactional
  public SolicitudAjusteStock aprobarAjuste(Long solicitudId, AprobarAjusteDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    RequestContext.requireActor(dto.getAdministradorId());
    SolicitudAjusteStock sol =
        solicitudAjusteStockRepository
            .buscarParaResolucion(solicitudId, RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Solicitud de ajuste no encontrada con ID: " + solicitudId));

    Long adminId = dto.getAdministradorId();
    if (adminId == null) {
      throw new IllegalArgumentException(
          "El ID del administrador es obligatorio para aprobar el ajuste.");
    }

    Producto bloqueado = sol.getProducto();
    RequestContext.checkTenant(bloqueado.getIdEstablecimiento());
    if (entityManager != null)
      entityManager.lock(bloqueado, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
    sol.aprobar(adminId);

    Producto p = sol.getProducto();
    MovimientoInventario mov = p.aplicarAjusteAprobado(sol.getCantidad(), sol.getId(), adminId);
    mov.setSolicitudAjuste(sol);
    productoRepository.save(p);
    movimientoInventarioRepository.save(mov);

    return solicitudAjusteStockRepository.save(sol);
  }

  @Transactional
  public SolicitudAjusteStock rechazarAjuste(Long solicitudId, RechazarAjusteDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    RequestContext.requireActor(dto.getAdministradorId());
    SolicitudAjusteStock sol =
        solicitudAjusteStockRepository
            .buscarParaResolucion(solicitudId, RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Solicitud de ajuste no encontrada con ID: " + solicitudId));

    Long adminId = dto.getAdministradorId();
    if (adminId == null) {
      throw new IllegalArgumentException(
          "El ID del administrador es obligatorio para rechazar el ajuste.");
    }

    sol.rechazar(adminId, dto.getMotivoRechazo());
    return solicitudAjusteStockRepository.save(sol);
  }

  @Transactional
  public void retenerStock(RetenerStockDTO dto) {
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("HOLD-" + dto.getReservaId() + "-" + dto.getProductoId());
    RequestContext.requireActor(dto.getUsuarioId());
    Producto p =
        productoRepository
            .findByIdAndIdEstablecimiento(dto.getProductoId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Producto no encontrado con ID: " + dto.getProductoId()));
    if (entityManager != null)
      entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

    if (dto.getReferenciaUnica() != null
        && movimientoInventarioRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoInventario previo =
          movimientoInventarioRepository
              .findByReferenciaUnica(dto.getReferenciaUnica())
              .orElseThrow();
      if (!p.getId().equals(previo.getProductoId())
          || previo.getCantidad() != dto.getCantidad()
          || previo.getTipo() != TipoMovimientoInventario.RESERVA)
        throw new IllegalStateException("Referencia asociada a otra operación");
      RequestContext.checkTenant(previo.getIdEstablecimiento());
      return;
    }

    MovimientoInventario mov =
        p.retenerStockPorReserva(dto.getCantidad(), dto.getReservaId(), dto.getUsuarioId());
    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    productoRepository.save(p);
    movimientoInventarioRepository.save(mov);

    if (reservaStockRepository != null && dto.getReservaId() != null) {
      ReservaStock rs =
          reservaStockRepository
              .findByReservaIdAndIdEstablecimiento(dto.getReservaId(), RequestContext.tenant())
              .orElseGet(() -> new ReservaStock(dto.getReservaId()));
      rs.setIdEstablecimiento(RequestContext.tenant());
      if (!"COMPROMETIDA".equals(rs.getEstado()))
        throw new IllegalStateException("La reserva de stock ya fue finalizada");
      rs.agregarDetalle(p, dto.getCantidad());
      reservaStockRepository.save(rs);
    }
  }

  @Transactional
  public void liberarStock(LiberarStockDTO dto) {
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("RELEASE-" + dto.getReservaId() + "-" + dto.getProductoId());
    RequestContext.requireActor(dto.getUsuarioId());
    Producto p =
        productoRepository
            .findByIdAndIdEstablecimiento(dto.getProductoId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Producto no encontrado con ID: " + dto.getProductoId()));
    if (entityManager != null)
      entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

    if (dto.getReferenciaUnica() != null
        && movimientoInventarioRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoInventario previo =
          movimientoInventarioRepository
              .findByReferenciaUnica(dto.getReferenciaUnica())
              .orElseThrow();
      if (!p.getId().equals(previo.getProductoId())
          || previo.getCantidad() != dto.getCantidad()
          || previo.getTipo() != TipoMovimientoInventario.LIBERACION)
        throw new IllegalStateException("Referencia asociada a otra operación");
      RequestContext.checkTenant(previo.getIdEstablecimiento());
      return;
    }

    finalizarCompromiso(dto.getReservaId(), p, dto.getCantidad(), false);
    MovimientoInventario mov =
        p.liberarStockRetenido(dto.getCantidad(), dto.getReservaId(), dto.getUsuarioId());
    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    productoRepository.save(p);
    movimientoInventarioRepository.save(mov);
  }

  @Transactional
  public void descontarStock(DescontarStockDTO dto) {
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica("CHARGE-" + dto.getEntregaId() + "-" + dto.getProductoId());
    RequestContext.requireActor(dto.getUsuarioId());
    Producto p =
        productoRepository
            .findByIdAndIdEstablecimiento(dto.getProductoId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Producto no encontrado con ID: " + dto.getProductoId()));
    if (entityManager != null)
      entityManager.lock(p, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);

    if (dto.getReferenciaUnica() != null
        && movimientoInventarioRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoInventario previo =
          movimientoInventarioRepository
              .findByReferenciaUnica(dto.getReferenciaUnica())
              .orElseThrow();
      if (!p.getId().equals(previo.getProductoId())
          || previo.getCantidad() != dto.getCantidad()
          || previo.getTipo() != TipoMovimientoInventario.ENTREGA)
        throw new IllegalStateException("Referencia asociada a otra operación");
      RequestContext.checkTenant(previo.getIdEstablecimiento());
      return;
    }

    if (dto.isVieneDeReserva()) finalizarCompromiso(dto.getReservaId(), p, dto.getCantidad(), true);
    MovimientoInventario mov =
        p.descontarStockPorEntrega(
            dto.getCantidad(), dto.getEntregaId(), dto.isVieneDeReserva(), dto.getUsuarioId());
    mov.setEntregaId(dto.getEntregaId());
    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    productoRepository.save(p);
    movimientoInventarioRepository.save(mov);
  }

  @Transactional
  public void reingresarStockPorDevolucion(ReingresarStockDTO dto) {
    if (!dto.isOrigenValido() || dto.getEntregaId() == null || dto.getEntregaId() <= 0
        || dto.getProductoId() == null || dto.getProductoId() <= 0 || dto.getCantidad() <= 0
        || (dto.getDevolucionId() != null && dto.getDevolucionId() <= 0)
        || (dto.getOperacionCompensacionId() != null && dto.getOperacionCompensacionId() <= 0))
      throw new IllegalArgumentException("Datos de reingreso inválidos");
    String referenciaEsperada = dto.getOperacionCompensacionId() == null
        ? "REFUND-" + dto.getDevolucionId() + "-" + dto.getProductoId()
        : "COMPENSACION-" + dto.getOperacionCompensacionId() + "-" + dto.getProductoId();
    if (dto.getReferenciaUnica() == null || dto.getReferenciaUnica().isBlank())
      dto.setReferenciaUnica(referenciaEsperada);
    if (dto.getOperacionCompensacionId() != null && !referenciaEsperada.equals(dto.getReferenciaUnica()))
      throw new IllegalArgumentException("Referencia de compensación inválida");
    RequestContext.requireActor(dto.getUsuarioId());
    Producto p =
        productoRepository
            .buscarParaActualizacion(dto.getProductoId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Producto no encontrado con ID: " + dto.getProductoId()));

    if (dto.getReferenciaUnica() != null
        && movimientoInventarioRepository.existsByReferenciaUnica(dto.getReferenciaUnica())) {
      MovimientoInventario previo =
          movimientoInventarioRepository
              .findByReferenciaUnica(dto.getReferenciaUnica())
              .orElseThrow();
      if (!p.getId().equals(previo.getProductoId())
          || previo.getCantidad() != dto.getCantidad()
          || !java.util.Objects.equals(previo.getEntregaId(), dto.getEntregaId())
          || !java.util.Objects.equals(previo.getDevolucionId(), dto.getDevolucionId())
          || !java.util.Objects.equals(previo.getOperacionCompensacionId(), dto.getOperacionCompensacionId())
          || previo.getTipo() != (dto.getOperacionCompensacionId() == null
              ? TipoMovimientoInventario.DEVOLUCION : TipoMovimientoInventario.COMPENSACION))
        throw new IllegalStateException("Referencia asociada a otra operación");
      RequestContext.checkTenant(previo.getIdEstablecimiento());
      return;
    }

    if (dto.getEntregaId() == null)
      throw new IllegalArgumentException("entregaId obligatorio para reingresar stock");
    List<MovimientoInventario> historial =
        movimientoInventarioRepository.findByProductoIdAndIdEstablecimientoOrderByFechaDesc(
            p.getId(), RequestContext.tenant());
    int entregado =
        historial.stream()
            .filter(
                m ->
                    dto.getEntregaId().equals(m.getEntregaId())
                        && m.getTipo() == TipoMovimientoInventario.ENTREGA)
            .map(MovimientoInventario::getCantidad)
            .reduce(0, Math::addExact);
    int devuelto =
        historial.stream()
            .filter(
                m ->
                    dto.getEntregaId().equals(m.getEntregaId())
                        && (m.getTipo() == TipoMovimientoInventario.DEVOLUCION
                            || m.getTipo() == TipoMovimientoInventario.COMPENSACION))
            .map(MovimientoInventario::getCantidad)
            .reduce(0, Math::addExact);
    if (dto.getCantidad() > Math.subtractExact(entregado, devuelto))
      throw new IllegalStateException(
          "El reingreso supera las unidades pendientes de devolver de la entrega");
    MovimientoInventario mov =
        dto.getOperacionCompensacionId() == null
            ? p.reponerStockPorDevolucion(dto.getCantidad(), dto.getDevolucionId(), dto.getUsuarioId())
            : p.reponerStockPorCompensacion(dto.getCantidad(), dto.getOperacionCompensacionId(), dto.getUsuarioId());
    mov.setEntregaId(dto.getEntregaId());
    mov.setDevolucionId(dto.getDevolucionId());
    mov.setOperacionCompensacionId(dto.getOperacionCompensacionId());
    if (dto.getReferenciaUnica() != null) {
      mov.setReferenciaUnica(dto.getReferenciaUnica());
    }

    productoRepository.save(p);
    movimientoInventarioRepository.save(mov);
  }

  @Transactional(readOnly = true)
  public List<IngresoStock> listarIngresos() {
    RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
    return ingresoStockRepository.findAllByIdEstablecimiento(RequestContext.tenant());
  }

  @Transactional(readOnly = true)
  public IngresoStock obtenerIngreso(Long id) {
    RequestContext.requireRoles("ENCARGADO", "ADMINISTRADOR");
    return ingresoStockRepository
        .findByIdAndIdEstablecimiento(id, RequestContext.tenant())
        .orElseThrow(() -> new IllegalArgumentException("Ingreso no encontrado"));
  }

  @Transactional(readOnly = true)
  public List<MovimientoInventario> listarMovimientos(
      Long productoId, TipoMovimientoInventario tipo) {
    if (productoId != null) {
      List<MovimientoInventario> lista =
          movimientoInventarioRepository
              .findByProductoIdAndIdEstablecimientoOrderByFechaDesc(
                  productoId, RequestContext.tenant())
              .stream()
              .filter(m -> RequestContext.tenant().equals(m.getIdEstablecimiento()))
              .toList();
      if (tipo != null) {
        return lista.stream().filter(m -> m.getTipo() == tipo).collect(Collectors.toList());
      }
      return lista.stream()
          .filter(m -> RequestContext.tenant().equals(m.getIdEstablecimiento()))
          .toList();
    }
    List<MovimientoInventario> todos =
        movimientoInventarioRepository.findAllByIdEstablecimiento(RequestContext.tenant());
    if (tipo != null) {
      return todos.stream().filter(m -> m.getTipo() == tipo).collect(Collectors.toList());
    }
    return todos;
  }

  private void finalizarCompromiso(
      Long reservaId, Producto producto, int cantidad, boolean consumir) {
    if (reservaId == null)
      throw new IllegalArgumentException("reservaId obligatorio para finalizar stock reservado");
    if (reservaStockRepository == null) return;
    ReservaStock reserva =
        reservaStockRepository
            .findByReservaIdAndIdEstablecimiento(reservaId, RequestContext.tenant())
            .orElseThrow(() -> new IllegalStateException("Reserva de stock no encontrada"));
    if (entityManager != null)
      entityManager.lock(reserva, jakarta.persistence.LockModeType.PESSIMISTIC_WRITE);
    reserva.finalizarProducto(producto.getId(), cantidad, consumir);
    reservaStockRepository.save(reserva);
  }
}
