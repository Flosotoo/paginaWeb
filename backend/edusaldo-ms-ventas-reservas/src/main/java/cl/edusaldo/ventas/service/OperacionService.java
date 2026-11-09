package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.client.*;
import cl.edusaldo.ventas.config.ContextoSolicitud;
import cl.edusaldo.ventas.exception.*;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.repository.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Supplier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OperacionService {
  private final TransactionTemplate transaction;
  private final OperacionDistribuidaRepository operaciones;
  private final ReservaRepository reservas;
  private final EntregaRepository entregas;
  private final DevolucionRepository devoluciones;
  private final NotificacionPendienteRepository notificaciones;
  private final SaldosClient saldos;
  private final InventarioClient inventario;
  private final UsuariosClient usuarios;

  public OperacionService(
      PlatformTransactionManager manager,
      OperacionDistribuidaRepository operaciones,
      ReservaRepository reservas,
      EntregaRepository entregas,
      DevolucionRepository devoluciones,
      NotificacionPendienteRepository notificaciones,
      SaldosClient saldos,
      InventarioClient inventario,
      UsuariosClient usuarios) {
    transaction = new TransactionTemplate(manager);
    transaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    this.operaciones = operaciones;
    this.reservas = reservas;
    this.entregas = entregas;
    this.devoluciones = devoluciones;
    this.notificaciones = notificaciones;
    this.saldos = saldos;
    this.inventario = inventario;
    this.usuarios = usuarios;
  }

  public <T> T local(Supplier<T> work) {
    return transaction.execute(status -> work.get());
  }

  public void disponible(String estado) {
    if (!"COMPLETADA".equals(estado))
      throw new ResponseStatusException(
          HttpStatus.CONFLICT,
          "El agregado tiene una operación pendiente; consulte su recuperación");
  }

  public OperacionDistribuida iniciar(
      String tipo,
      Long reserva,
      Long entrega,
      Long devolucion,
      Long usuario,
      String rol,
      String motivo) {
    OperacionDistribuida op =
        new OperacionDistribuida("OP-" + UUID.randomUUID(), tipo, reserva, entrega, devolucion);
    op.setIdEstablecimiento(ContextoSolicitud.establecimiento());
    op.setUmbralSaldoBajo(ContextoSolicitud.header("X-Umbral-Saldo-Bajo"));
    op.setUsuarioId(usuario);
    op.setRol(rol);
    op.setMotivo(motivo);
    return operaciones.saveAndFlush(op);
  }

  public OperacionDistribuida obtener(Long id) {
    return operaciones
        .findByIdAndIdEstablecimiento(id, ContextoSolicitud.establecimiento())
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operación no encontrada"));
  }

  public List<OperacionDistribuida> listar() {
    ContextoSolicitud.staff();
    return operaciones.findByIdEstablecimientoOrderByIdDesc(ContextoSolicitud.establecimiento());
  }

  private OperacionDistribuida bloqueo(Long id) {
    return operaciones
        .bloquear(id, ContextoSolicitud.establecimiento())
        .orElseThrow(
            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Operación no encontrada"));
  }

  public OperacionDistribuida recuperar(Long id) {
    ContextoSolicitud.staff();
    return ejecutar(id, ContextoSolicitud.usuario(null));
  }

  public void procesarNotificacion(Long id) {
    ContextoSolicitud.staff();
    try {
      if (!resolverNotificacion(id, true))
        throw new ResponseStatusException(
            HttpStatus.CONFLICT, "Notificación en espera, en proceso o ya procesada");
    } catch (ResponseStatusException e) {
      throw e;
    } catch (RuntimeException e) {
      throw new ResponseStatusException(
          HttpStatus.SERVICE_UNAVAILABLE, "No fue posible procesar la notificación", e);
    }
  }

  public Long registrarNotificacionPendiente(
      Long reservaId, Long entregaId, Long alumnoId, String evento, Long establecimiento) {
    return registrarNotificacionPendiente(reservaId, entregaId, alumnoId, evento, establecimiento, null);
  }

  private Long registrarNotificacionPendiente(
      Long reservaId, Long entregaId, Long alumnoId, String evento, Long establecimiento, Reserva reserva) {
    NotificacionPendiente aviso = NotificacionPendiente.pendiente(
        reservaId, entregaId, alumnoId, evento, establecimiento);
    if ("RESERVA".equals(evento)) aviso.detallarReserva(Objects.requireNonNull(reserva));
    return notificaciones.save(aviso).getId();
  }

  void resolverNotificacion(Long id) {
    resolverNotificacion(id, false);
  }

  private boolean resolverNotificacion(Long id, boolean manual) {
    Long tenant = ContextoSolicitud.establecimiento();
    NotificacionPendiente anterior =
        local(
            () -> {
              NotificacionPendiente n =
                  notificaciones
                      .bloquear(id, tenant)
                      .orElseThrow(
                          () ->
                              new ResponseStatusException(
                                  HttpStatus.NOT_FOUND, "Notificación no encontrada"));
              if (manual && "ERROR_REINTENTOS".equals(n.getEstado())) {
                n.setEstado("PENDIENTE");
                n.setIntentos(0);
                n.setSiguienteIntento(null);
              }
              if (!"PENDIENTE".equals(n.getEstado())) return null;
              if (n.getSiguienteIntento() != null
                  && n.getSiguienteIntento().isAfter(LocalDateTime.now())) return null;
              if (n.getIntentos() >= 5) {
                n.setEstado("ERROR_REINTENTOS");
                n.setSiguienteIntento(null);
                notificaciones.save(n);
                return null;
              }
              n.setIntentos(n.getIntentos() + 1);
              // La reserva temporal impide que dos ejecutores procesen simultáneamente el mismo
              // evento.
              n.setSiguienteIntento(LocalDateTime.now().plusSeconds(30));
              return notificaciones.save(n);
            });
    if (anterior == null) return false;
    int intento = anterior.getIntentos();
    try {
      List<String> correos = usuarios.correosApoderados(anterior.getAlumnoId());
      if (correos == null || correos.isEmpty())
        throw new IllegalStateException("No se encontraron destinatarios para la notificación");
      return local(
          () -> {
            NotificacionPendiente pendiente = notificaciones.bloquear(id, tenant).orElseThrow();
            if (!"PENDIENTE".equals(pendiente.getEstado()) || pendiente.getIntentos() != intento)
              return false;
            Iterator<String> destinatarios = new LinkedHashSet<>(correos).iterator();
            pendiente.setDestinatarioCorreo(destinatarios.next());
            pendiente.setEstado("SIMULADA");
            pendiente.setSiguienteIntento(null);
            pendiente.setFechaEnvio(null);
            notificaciones.save(pendiente);
            while (destinatarios.hasNext()) {
              NotificacionPendiente copia =
                  new NotificacionPendiente(
                      pendiente.getReservaId(),
                      pendiente.getEntregaId(),
                      pendiente.getAlumnoId(),
                      pendiente.getTipoEvento(),
                      destinatarios.next(),
                      pendiente.getAsunto(),
                      pendiente.getMensaje());
              copia.setIdEstablecimiento(tenant);
              copia.setIntentos(intento);
              notificaciones.save(copia);
            }
            return true;
          });
    } catch (RuntimeException error) {
      local(
          () -> {
            NotificacionPendiente n = notificaciones.bloquear(id, tenant).orElseThrow();
            if ("PENDIENTE".equals(n.getEstado()) && n.getIntentos() == intento) {
              if (intento >= 5) {
                n.setEstado("ERROR_REINTENTOS");
                n.setSiguienteIntento(null);
              } else {
                n.setSiguienteIntento(LocalDateTime.now().plusSeconds(Math.min(60, 1L << intento)));
              }
              notificaciones.save(n);
            }
            return null;
          });
      throw error;
    }
  }

  public OperacionDistribuida ejecutar(Long id) {
    return ejecutar(id, null);
  }

  private OperacionDistribuida ejecutar(Long id, Long recuperador) {
    OperacionDistribuida op =
        local(
            () -> {
              OperacionDistribuida o = bloqueo(id);
              if (terminal(o)) return o;
              if (o.getEjecucionHasta() != null
                  && o.getEjecucionHasta().isAfter(LocalDateTime.now()))
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "La operación está siendo procesada");
              if (recuperador != null) o.setRecuperadaPorId(recuperador);
              o.setEjecucionHasta(LocalDateTime.now().plusSeconds(30));
              return operaciones.save(o);
            });
    if (terminal(op)) return op;
    java.util.Map<String, String> headers = new java.util.HashMap<>();
    headers.put("X-Establecimiento-Id", op.getIdEstablecimiento().toString());
    headers.put("X-Usuario-Id", op.getUsuarioId().toString());
    headers.put("X-Rol", op.getRol());
    headers.put("X-Umbral-Saldo-Bajo", op.getUmbralSaldoBajo());
    var contexto = ContextoSolicitud.interno(headers);
    try {
      if ("COMPENSAR".equals(op.getDireccion())) compensar(op);
      else continuar(op);
      return obtener(id);
    } catch (RechazoRemotoException ex) {
      if (Set.of("RESERVA", "ENTREGA_MESON").contains(op.getTipo())
          && op.getDireccion().equals("CONTINUAR")) {
        local(
            () -> {
              OperacionDistribuida o = bloqueo(id);
              o.setDireccion("COMPENSAR");
              operaciones.save(o);
              return null;
            });
        op.setDireccion("COMPENSAR");
        try {
          compensar(op);
        } catch (Exception compensacion) {
          pendiente(id);
          throw new OperacionPendienteException(id, compensacion);
        }
        throw ex;
      }
      pendiente(id);
      throw new OperacionPendienteException(id, ex);
    } catch (Exception ex) {
      pendiente(id);
      throw new OperacionPendienteException(id, ex);
    } finally {
      contexto.close();
    }
  }

  private boolean terminal(OperacionDistribuida o) {
    return Set.of("COMPLETADA", "COMPENSADA").contains(o.getEstado());
  }

  private void pendiente(Long id) {
    local(
        () -> {
          OperacionDistribuida o = bloqueo(id);
          o.marcarPendienteRecuperacion();
          o.setEjecucionHasta(null);
          return operaciones.save(o);
        });
  }

  private void paso(OperacionDistribuida op, String nombre, Runnable accion) {
    if (op.confirmado(nombre)) return;
    accion.run();
    local(
        () -> {
          OperacionDistribuida o = bloqueo(op.getId());
          o.confirmarPaso(nombre);
          o.setEjecucionHasta(LocalDateTime.now().plusSeconds(30));
          operaciones.save(o);
          return null;
        });
    op.confirmarPaso(nombre);
  }

  private Reserva reserva(OperacionDistribuida op) {
    return reservas
        .findByIdAndIdEstablecimiento(op.getReservaId(), op.getIdEstablecimiento())
        .orElseThrow();
  }

  private Entrega entrega(OperacionDistribuida op) {
    return entregas
        .findByIdAndIdEstablecimiento(op.getEntregaId(), op.getIdEstablecimiento())
        .orElseThrow();
  }

  private Devolucion devolucion(OperacionDistribuida op) {
    return devoluciones
        .findByIdAndIdEstablecimiento(op.getDevolucionId(), op.getIdEstablecimiento())
        .orElseThrow();
  }

  private Map<Long, Integer> cantidadesReserva(Reserva r) {
    Map<Long, Integer> m = new TreeMap<>();
    r.getDetalles().forEach(d -> m.merge(d.getProductoId(), d.getCantidad(), Math::addExact));
    return m;
  }

  private Map<Long, Integer> cantidadesEntrega(Entrega e) {
    Map<Long, Integer> m = new TreeMap<>();
    e.getDetalles().forEach(d -> m.merge(d.getProductoId(), d.getCantidad(), Math::addExact));
    return m;
  }

  private Map<Long, Integer> cantidadesDevolucion(Devolucion d) {
    Map<Long, Integer> m = new TreeMap<>();
    d.getDetalles().forEach(i -> m.merge(i.getProductoId(), i.getCantidad(), Math::addExact));
    return m;
  }

  private void continuar(OperacionDistribuida op) {
    switch (op.getTipo()) {
      case "RESERVA" -> {
        Reserva r = reserva(op);
        paso(
            op,
            "SALDO",
            () -> saldos.comprometerSaldo(r.getAlumnoId(), r.getTotal(), r.getCodigo(), r.getId()));
        cantidadesReserva(r)
            .forEach(
                (producto, cantidad) ->
                    paso(
                        op,
                        "STOCK-" + producto,
                        () ->
                            inventario.reservarStock(
                                producto, cantidad, op.getUsuarioId(), r.getId())));
      }
      case "CANCELACION" -> {
        Reserva r = reserva(op);
        paso(
            op,
            "SALDO",
            () -> saldos.liberarSaldo(r.getAlumnoId(), r.getTotal(), r.getCodigo(), r.getId()));
        cantidadesReserva(r)
            .forEach(
                (producto, cantidad) ->
                    paso(
                        op,
                        "STOCK-" + producto,
                        () ->
                            inventario.liberarStock(
                                producto, cantidad, op.getUsuarioId(), r.getId())));
      }
      case "ENTREGA_MESON", "ENTREGA_RESERVA" -> {
        Entrega e = entrega(op);
        boolean reserva = e.getReservaId() != null;
        paso(
            op,
            "SALDO",
            () ->
                saldos.descontarSaldo(
                    e.getAlumnoId(),
                    e.getTotal(),
                    reserva,
                    e.getNumero(),
                    e.getId(),
                    e.getReservaId()));
        cantidadesEntrega(e)
            .forEach(
                (producto, cantidad) ->
                    paso(
                        op,
                        "STOCK-" + producto,
                        () ->
                            inventario.descontarStock(
                                producto,
                                cantidad,
                                reserva,
                                op.getUsuarioId(),
                                e.getId(),
                                e.getReservaId())));
      }
      case "DEVOLUCION" -> {
        Devolucion d = devolucion(op);
        paso(
            op,
            "SALDO",
            () ->
                saldos.reintegrarSaldo(
                    d.getAlumnoId(),
                    d.getTotalReintegro(),
                    d.getCodigoDevolucion(),
                    op.getUsuarioId(),
                    d.getId(),
                    d.getEntregaId()));
        cantidadesDevolucion(d)
            .forEach(
                (producto, cantidad) ->
                    paso(
                        op,
                        "STOCK-" + producto,
                        () ->
                            inventario.reingresarStock(
                                producto,
                                cantidad,
                                op.getUsuarioId(),
                                d.getMotivo(),
                                d.getId(),
                                d.getEntregaId())));
      }
      default -> throw new IllegalStateException("Tipo de operación no válido");
    }
    Long alumno = op.getEntregaId() != null ? entrega(op).getAlumnoId() : reserva(op).getAlumnoId();
    local(
        () -> {
          OperacionDistribuida actual = bloqueo(op.getId());
          if (terminal(actual)) return null;
          Reserva r =
              op.getReservaId() == null
                  ? null
                  : reservas.bloquear(op.getReservaId(), op.getIdEstablecimiento()).orElseThrow();
          Entrega e =
              op.getEntregaId() == null
                  ? null
                  : entregas.bloquear(op.getEntregaId(), op.getIdEstablecimiento()).orElseThrow();
          if (op.getTipo().equals("CANCELACION"))
            r.cancelar(op.getMotivo(), op.getUsuarioId(), op.getRol());
          if (op.getTipo().equals("ENTREGA_RESERVA")) r.setEstado(EstadoReserva.ENTREGADA);
          if (op.getTipo().equals("DEVOLUCION")) {
            Devolucion d = devolucion(op);
            for (DetalleDevolucion detalle : d.getDetalles())
              e.getDetalles().stream()
                  .filter(i -> i.getId().equals(detalle.getDetalleEntregaId()))
                  .findFirst()
                  .orElseThrow()
                  .registrarDevolucion(detalle.getCantidad());
            d.setEstadoOperacion("COMPLETADA");
            devoluciones.save(d);
          }
          if (r != null) {
            r.setEstadoOperacion("COMPLETADA");
            reservas.save(r);
          }
          if (e != null) {
            e.setEstadoOperacion("COMPLETADA");
            entregas.save(e);
          }
          registrarNotificacionPendiente(
              op.getReservaId(),
              op.getEntregaId(),
              alumno,
              op.getTipo(),
              op.getIdEstablecimiento(),
              r);
          actual.marcarCompletada();
          actual.setEjecucionHasta(null);
          operaciones.save(actual);
          return null;
        });
  }

  private void compensar(OperacionDistribuida op) {
    if ("ENTREGA_MESON".equals(op.getTipo())) {
      compensarEntregaMeson(op);
      return;
    }
    Reserva r = reserva(op);
    if (op.confirmado("SALDO"))
      paso(
          op,
          "COMP-SALDO",
          () -> saldos.liberarSaldo(r.getAlumnoId(), r.getTotal(), r.getCodigo(), r.getId()));
    cantidadesReserva(r)
        .forEach(
            (producto, cantidad) -> {
              if (op.confirmado("STOCK-" + producto))
                paso(
                    op,
                    "COMP-STOCK-" + producto,
                    () ->
                        inventario.liberarStock(producto, cantidad, op.getUsuarioId(), r.getId()));
            });
    local(
        () -> {
          OperacionDistribuida actual = bloqueo(op.getId());
          Reserva reserva = reservas.bloquear(r.getId(), op.getIdEstablecimiento()).orElseThrow();
          reserva.setEstado(EstadoReserva.CANCELADA);
          reserva.setEstadoOperacion("COMPENSADA");
          reservas.save(reserva);
          actual.marcarCompensada();
          actual.setEjecucionHasta(null);
          operaciones.save(actual);
          return null;
        });
  }

  private void compensarEntregaMeson(OperacionDistribuida op) {
    Entrega e = entrega(op);
    cantidadesEntrega(e)
        .forEach(
            (producto, cantidad) -> {
              if (op.confirmado("STOCK-" + producto)) {
                paso(
                    op,
                    "COMP-STOCK-" + producto,
                    () ->
                        inventario.compensarEntrega(
                            producto, cantidad, op.getUsuarioId(), op.getId(), e.getId()));
              }
            });
    if (op.confirmado("SALDO")) {
      paso(
          op,
          "COMP-SALDO",
          () -> saldos.compensarEntrega(e.getAlumnoId(), e.getTotal(), op.getId(), e.getId()));
    }
    local(
        () -> {
          OperacionDistribuida actual = bloqueo(op.getId());
          Entrega guardada = entregas.bloquear(e.getId(), op.getIdEstablecimiento()).orElseThrow();
          guardada.setEstadoOperacion("COMPENSADA");
          entregas.save(guardada);
          actual.marcarCompensada();
          actual.setEjecucionHasta(null);
          operaciones.save(actual);
          return null;
        });
  }
}
