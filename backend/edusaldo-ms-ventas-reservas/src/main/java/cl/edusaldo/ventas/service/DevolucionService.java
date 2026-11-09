package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.dto.CrearDevolucionDTO;
import cl.edusaldo.ventas.dto.ItemDevolucionDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Devolucion;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OperacionDistribuida;
import cl.edusaldo.ventas.repository.DevolucionRepository;
import cl.edusaldo.ventas.repository.EntregaRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class DevolucionService {

  private final DevolucionRepository devolucionRepository;
  private final EntregaRepository entregaRepository;
  private final OperacionService operaciones;
  private final cl.edusaldo.ventas.client.UsuariosClient usuariosClient;

  public DevolucionService(
      DevolucionRepository devoluciones,
      EntregaRepository entregas,
      OperacionService operaciones,
      cl.edusaldo.ventas.client.UsuariosClient usuarios) {
    this.devolucionRepository = devoluciones;
    this.entregaRepository = entregas;
    this.operaciones = operaciones;
    this.usuariosClient = usuarios;
  }

  public Devolucion registrarDevolucion(CrearDevolucionDTO dto) {
    if (dto.getItems() == null || dto.getItems().isEmpty())
      throw new IllegalArgumentException("La devolución debe contener materiales");
    java.util.Set<Long> unicos = new java.util.HashSet<>();
    for (ItemDevolucionDTO item : dto.getItems())
      if (!unicos.add(item.getDetalleEntregaId()))
        throw new IllegalArgumentException("No se permite repetir detalles de entrega");
    cl.edusaldo.ventas.config.ContextoSolicitud.staff();
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(dto.getEncargadoId());
    OperacionDistribuida op =
        operaciones.local(
            () -> {
              Entrega entrega =
                  entregaRepository
                      .bloquear(
                          dto.getEntregaId(),
                          cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
                      .orElseThrow(() -> new IllegalArgumentException("Entrega no encontrada"));
              operaciones.disponible(entrega.getEstadoOperacion());
              Map<Long, DetalleEntrega> detalles =
                  entrega.getDetalles().stream()
                      .collect(Collectors.toMap(DetalleEntrega::getId, Function.identity()));
              Devolucion dev =
                  new Devolucion(
                      "DEV-" + java.util.UUID.randomUUID(),
                      entrega.getId(),
                      entrega.getAlumnoId(),
                      dto.getMotivo(),
                      0,
                      actor);
              for (ItemDevolucionDTO item : dto.getItems()) {
                DetalleEntrega d = detalles.get(item.getDetalleEntregaId());
                if (d == null)
                  throw new IllegalArgumentException("El detalle no pertenece a la entrega");
                if (item.getCantidad() <= 0
                    || item.getCantidad() > d.getCantidad() - d.getCantidadDevuelta())
                  throw new IllegalStateException("La devolución excede la cantidad disponible");
                dev.agregarDetalle(
                    d.getId(),
                    d.getProductoId(),
                    d.getNombreProducto(),
                    item.getCantidad(),
                    d.getPrecioUnitario());
              }
              dev.registrar();
              dev.setIdEstablecimiento(entrega.getIdEstablecimiento());
              dev.setEstadoOperacion("PENDIENTE_RECUPERACION");
              entrega.setEstadoOperacion("PENDIENTE_RECUPERACION");
              devolucionRepository.saveAndFlush(dev);
              entregaRepository.save(entrega);
              return operaciones.iniciar(
                  "DEVOLUCION",
                  entrega.getReservaId(),
                  entrega.getId(),
                  dev.getId(),
                  actor,
                  cl.edusaldo.ventas.config.ContextoSolicitud.rol(),
                  dto.getMotivo());
            });
    operaciones.ejecutar(op.getId());
    return obtenerPorId(op.getDevolucionId());
  }

  public Devolucion obtenerPorId(Long id) {
    return devolucionRepository
        .findByIdAndIdEstablecimiento(
            id, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .filter(d -> permitida(d.getAlumnoId()))
        .orElseThrow(
            () ->
                new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Devolucion no encontrada"));
  }

  public List<Devolucion> listarPorEntrega(Long entregaId) {
    return listarTodas().stream().filter(d -> d.getEntregaId().equals(entregaId)).toList();
  }

  public List<Devolucion> listarPorAlumno(Long alumnoId) {
    return listarTodas().stream().filter(d -> d.getAlumnoId().equals(alumnoId)).toList();
  }

  public List<Devolucion> listarTodas() {
    return devolucionRepository
        .findByIdEstablecimientoOrderByIdDesc(
            cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .stream()
        .filter(d -> permitida(d.getAlumnoId()))
        .toList();
  }

  private boolean permitida(Long alumno) {
    if (cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ENCARGADO")
        || cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ADMINISTRADOR")) return true;
    return usuariosClient.puedeConsultarAlumno(alumno);
  }
}
