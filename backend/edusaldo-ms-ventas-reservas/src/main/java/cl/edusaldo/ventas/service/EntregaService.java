package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.client.InventarioClient;
import cl.edusaldo.ventas.client.UsuariosClient;
import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.ItemEntregaDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OperacionDistribuida;
import cl.edusaldo.ventas.repository.EntregaRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class EntregaService {

  private final EntregaRepository entregaRepository;
  private final OperacionService operaciones;
  private final UsuariosClient usuariosClient;
  private final InventarioClient inventarioClient;

  public EntregaService(
      EntregaRepository entregas,
      OperacionService operaciones,
      UsuariosClient usuarios,
      InventarioClient inventario) {
    this.entregaRepository = entregas;
    this.operaciones = operaciones;
    this.usuariosClient = usuarios;
    this.inventarioClient = inventario;
  }

  public Entrega registrarEntregaMeson(EntregaMesonDTO dto) {
    if (dto.getItems() == null || dto.getItems().isEmpty()) {
      throw new IllegalArgumentException("La entrega debe contener al menos un material.");
    }

    java.util.Set<Long> unicos = new java.util.HashSet<>();
    for (ItemEntregaDTO item : dto.getItems())
      if (!unicos.add(item.getProductoId()))
        throw new IllegalArgumentException("No se permite repetir productos en una entrega");
    cl.edusaldo.ventas.config.ContextoSolicitud.staff();
    dto.setEncargadoId(cl.edusaldo.ventas.config.ContextoSolicitud.usuario(dto.getEncargadoId()));
    if (usuariosClient != null) {
      usuariosClient.validarAlumnoYVinculo(dto.getAlumnoId(), dto.getEncargadoId());
    }

    List<DetalleEntrega> detalles = new ArrayList<>();
    for (ItemEntregaDTO item : dto.getItems()) {
      int precio = (item.getPrecioUnitario() != null) ? item.getPrecioUnitario() : 0;
      String nombre = (item.getNombreProducto() != null) ? item.getNombreProducto() : "";
      if (inventarioClient != null) {
        java.util.Map<String, Object> prod =
            inventarioClient.consultarProductoActivo(item.getProductoId());
        if (prod != null) {
          Object disponible = prod.get("stockDisponible");
          if (!(disponible instanceof Number))
            throw new IllegalStateException("No se pudo comprobar el stock disponible");
          if (((Number) disponible).longValue() < item.getCantidad())
            throw new IllegalStateException("Stock insuficiente para la entrega");
          if (prod.get("precio") != null) {
            precio = Integer.parseInt(prod.get("precio").toString());
          }
          if (prod.get("nombre") != null) {
            nombre = String.valueOf(prod.get("nombre"));
          }
        }
      }
      detalles.add(
          new DetalleEntrega(null, item.getProductoId(), nombre, item.getCantidad(), precio));
    }

    Entrega entrega = Entrega.registrarEnMeson(dto.getAlumnoId(), dto.getEncargadoId(), detalles);

    entrega.setIdEstablecimiento(cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento());
    entrega.setEstadoOperacion("PENDIENTE_RECUPERACION");
    OperacionDistribuida op =
        operaciones.local(
            () -> {
              entregaRepository.saveAndFlush(entrega);
              return operaciones.iniciar(
                  "ENTREGA_MESON",
                  null,
                  entrega.getId(),
                  null,
                  dto.getEncargadoId(),
                  cl.edusaldo.ventas.config.ContextoSolicitud.rol(),
                  null);
            });
    operaciones.ejecutar(op.getId());
    Entrega guardada = obtenerPorId(entrega.getId());
    return guardada;
  }

  public Entrega obtenerPorId(Long id) {
    return entregaRepository
        .findByIdAndIdEstablecimiento(
            id, cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .filter(e -> permitida(e.getAlumnoId()))
        .orElseThrow(
            () ->
                new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Entrega no encontrada"));
  }

  public List<Entrega> listarPorAlumno(Long alumnoId) {
    return listarHistorial().stream().filter(e -> e.getAlumnoId().equals(alumnoId)).toList();
  }

  public List<Entrega> listarHistorial() {
    return entregaRepository
        .findByIdEstablecimientoOrderByIdDesc(
            cl.edusaldo.ventas.config.ContextoSolicitud.establecimiento())
        .stream()
        .filter(e -> permitida(e.getAlumnoId()))
        .toList();
  }

  public List<Entrega> listarDelDia() {
    LocalDateTime inicio = LocalDate.now().atStartOfDay();
    LocalDateTime fin = LocalDate.now().atTime(LocalTime.MAX);
    return listarHistorial().stream()
        .filter(e -> !e.getFecha().isBefore(inicio) && !e.getFecha().isAfter(fin))
        .toList();
  }

  private boolean permitida(Long alumno) {
    if (cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ENCARGADO")
        || cl.edusaldo.ventas.config.ContextoSolicitud.rol().equals("ADMINISTRADOR")) return true;
    return usuariosClient.puedeConsultarAlumno(alumno);
  }
}
