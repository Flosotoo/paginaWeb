package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.client.InventarioClient;
import cl.edusaldo.ventas.client.UsuariosClient;
import cl.edusaldo.ventas.dto.CrearReservaDTO;
import cl.edusaldo.ventas.dto.ItemReservaDTO;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.repository.NotificacionPendienteRepository;
import cl.edusaldo.ventas.repository.ReservaRepository;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ReservaService {

  private final ReservaRepository reservaRepository;
  private final EntregaRepository entregaRepository;
  private final NotificacionPendienteRepository notificacionRepository;
  private final OperacionService operaciones;
  private final UsuariosClient usuariosClient;
  private final InventarioClient inventarioClient;

  public ReservaService(
      ReservaRepository reservas,
      EntregaRepository entregas,
      NotificacionPendienteRepository notificaciones,
      OperacionService operaciones,
      UsuariosClient usuarios,
      InventarioClient inventario) {
    this.reservaRepository = reservas;
    this.entregaRepository = entregas;
    this.notificacionRepository = notificaciones;
    this.operaciones = operaciones;
    this.usuariosClient = usuarios;
    this.inventarioClient = inventario;
  }

  public Reserva crearReserva(CrearReservaDTO dto) {
    if (dto.getItems() == null || dto.getItems().isEmpty()) {
      throw new IllegalArgumentException("La reserva debe contener al menos un material.");
    }

    java.util.Set<Long> productosUnicos = new java.util.HashSet<>();
    for (ItemReservaDTO item : dto.getItems()) {
      if (!productosUnicos.add(item.getProductoId()))
        throw new IllegalArgumentException("No se permite repetir productos en una reserva");
    }
    dto.setCreadaPorId(cl.edusaldo.ventas.config.ContextoSolicitud.usuario(dto.getCreadaPorId()));
    if (!permitida(dto.getAlumnoId()))
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN,
          "El alumno no está vinculado al solicitante");
    if (usuariosClient != null) {
      usuariosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getCreadaPorId());
      usuariosClient.validarAutonomiaReserva(dto.getAlumnoId(), dto.getCreadaPorId());
    }

    java.util.List<ItemReservaDTO> itemsProcesados = new java.util.ArrayList<>();
    int total = 0;
    for (ItemReservaDTO item : dto.getItems()) {
      int precio = (item.getPrecioUnitario() != null) ? item.getPrecioUnitario() : 0;
      String nombre = (item.getNombreProducto() != null) ? item.getNombreProducto() : "";
      if (inventarioClient != null) {
        Map<String, Object> prod = inventarioClient.consultarProductoActivo(item.getProductoId());
        if (prod != null) {
          if (prod.get("precio") != null) {
            precio = Integer.parseInt(prod.get("precio").toString());
          }
          if (prod.get("nombre") != null) {
            nombre = String.valueOf(prod.get("nombre"));
          }
        }
      }
      total = Math.addExact(total, Math.multiplyExact(item.getCantidad(), precio));
      itemsProcesados.add(
          new ItemReservaDTO(item.getProductoId(), nombre, item.getCantidad(), precio));
    }

    String codigo = "RES-" + java.util.UUID.randomUUID().toString();
    Reserva r = new Reserva(codigo, dto.getAlumnoId(), dto.getCreadaPorId(), total);

    for (ItemReservaDTO item : itemsProcesados) {
      r.agregarDetalle(
          item.getProductoId(),
          item.getNombreProducto(),
          item.getCantidad(),
          item.getPrecioUnitario());
    }

    r.confirmar();
    r.setIdEstablecimiento(cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento());
    r.setEstadoOperacion("PENDIENTE_RECUPERACION");
    OperacionDistribuida op =
        operaciones.local(
            () -> {
              reservaRepository.saveAndFlush(r);
              return operaciones.iniciar(
                  "RESERVA",
                  r.getId(),
                  null,
                  null,
                  dto.getCreadaPorId(),
                  cl.edusaldo.ventas.config.ContextoSolicitud.rol(),
                  null);
            });
    operaciones.ejecutar(op.getId());
    Reserva guardada = obtenerPorId(r.getId());
    return guardada;
  }

  public Reserva marcarListaParaRetiro(Long reservaId, Long encargadoId) {
    cl.edusaldo.ventas.config.ContextoSolicitud.staff();
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(encargadoId);
    obtenerPorId(reservaId);
    operaciones.local(
        () -> {
          Reserva r =
              reservaRepository
                  .bloquear(
                      reservaId, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
                  .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
          operaciones.disponible(r.getEstadoOperacion());
          r.marcarListaParaRetiro(actor);
          reservaRepository.save(r);
          operaciones.registrarNotificacionPendiente(
              r.getId(), null, r.getAlumnoId(), "RESERVA_LISTA_RETIRO", r.getIdEstablecimiento());
          return null;
        });
    return obtenerPorId(reservaId);
  }

  public Reserva cancelarReserva(Long reservaId, String motivo, Long usuarioId, String rol) {
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(usuarioId);
    String rolSeguro =
        cl.edusaldo.ventas.config.ContextoSolicitud.header("X-Rol") == null
            ? rol
            : cl.edusaldo.ventas.config.ContextoSolicitud.rol();
    obtenerPorId(reservaId);
    OperacionDistribuida op =
        operaciones.local(
            () -> {
              Reserva r =
                  reservaRepository
                      .bloquear(
                          reservaId, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
                      .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
              operaciones.disponible(r.getEstadoOperacion());
              EstadoReserva previo = r.getEstado();
              r.cancelar(motivo, actor, rolSeguro);
              r.setEstado(previo);
              r.setMotivoCancelacion(null);
              r.setCanceladaPorId(null);
              r.setEstadoOperacion("PENDIENTE_RECUPERACION");
              reservaRepository.save(r);
              return operaciones.iniciar(
                  "CANCELACION", r.getId(), null, null, actor, rolSeguro, motivo);
            });
    operaciones.ejecutar(op.getId());
    Reserva guardada = obtenerPorId(reservaId);
    return guardada;
  }

  public Entrega entregarReserva(Long reservaId, Long encargadoId) {
    cl.edusaldo.ventas.config.ContextoSolicitud.staff();
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(encargadoId);
    OperacionDistribuida op =
        operaciones.local(
            () -> {
              Reserva r =
                  reservaRepository
                      .bloquear(
                          reservaId, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
                      .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada"));
              operaciones.disponible(r.getEstadoOperacion());
              EstadoReserva previo = r.getEstado();
              Entrega entrega = r.confirmarRetiroYGenerarEntrega(actor);
              r.setEstado(previo);
              r.setEstadoOperacion("PENDIENTE_RECUPERACION");
              entrega.setEstadoOperacion("PENDIENTE_RECUPERACION");
              entregaRepository.saveAndFlush(entrega);
              reservaRepository.save(r);
              return operaciones.iniciar(
                  "ENTREGA_RESERVA",
                  r.getId(),
                  entrega.getId(),
                  null,
                  actor,
                  cl.edusaldo.ventas.config.ContextoSolicitud.rol(),
                  null);
            });
    operaciones.ejecutar(op.getId());
    Entrega guardada =
        entregaRepository
            .findByIdAndIdEstablecimiento(
                op.getEntregaId(), cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
            .orElseThrow();
    return guardada;
  }

  public Reserva obtenerPorId(Long id) {
    return reservaRepository
        .findByIdAndIdEstablecimiento(
            id, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .filter(r -> permitida(r.getAlumnoId()))
        .orElseThrow(
            () ->
                new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Reserva no encontrada"));
  }

  public List<Reserva> listarPorAlumno(Long alumnoId) {
    return listarTodas().stream().filter(r -> r.getAlumnoId().equals(alumnoId)).toList();
  }

  public List<Reserva> listarTodas() {
    return reservaRepository
        .findByIdEstablecimientoOrderByIdDesc(
            cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .stream()
        .filter(r -> permitida(r.getAlumnoId()))
        .toList();
  }

  public List<Reserva> listarPorEstado(EstadoReserva estado) {
    return listarTodas().stream().filter(r -> r.getEstado() == estado).toList();
  }

  public List<NotificacionPendiente> listarNotificaciones() {
    if (notificacionRepository == null) {
      return Collections.emptyList();
    }
    java.util.Map<Long, Boolean> accesoPorAlumno = new java.util.HashMap<>();
    return notificacionRepository
        .findByIdEstablecimientoOrderByFechaCreacionDesc(
            cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .stream()
        .filter(n -> accesoPorAlumno.computeIfAbsent(n.getAlumnoId(), this::permitida))
        .toList();
  }

  private boolean permitida(Long alumno) {
    if (cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ENCARGADO")
        || cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ADMINISTRADOR")) return true;
    return usuariosClient.puedeConsultarAlumno(alumno);
  }
}
