package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.Reserva;
import cl.edusaldo.ventas.service.ReservaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
@Tag(
    name = "Reservas",
    description =
        "Ciclo de reserva de materiales con trazabilidad de preparación, retiro y notificaciones"
            + " persistentes")
public class ReservaController {

  private final ReservaService reservaService;

  public ReservaController(ReservaService reservaService) {
    this.reservaService = reservaService;
  }

  @PostMapping
  @Operation(summary = "Crear nueva reserva de materiales con retención de saldo y stock")
  public ResponseEntity<ReservaResponseDTO> crear(@Valid @RequestBody CrearReservaDTO dto) {
    Reserva r = reservaService.crearReserva(dto);
    return ResponseEntity.status(HttpStatus.CREATED).body(new ReservaResponseDTO(r));
  }

  @GetMapping("/{id}")
  @Operation(summary = "Consultar reserva por ID")
  public ResponseEntity<ReservaResponseDTO> obtenerPorId(@PathVariable Long id) {
    Reserva r = reservaService.obtenerPorId(id);
    return ResponseEntity.ok(new ReservaResponseDTO(r));
  }

  @GetMapping("/alumno/{alumnoId}")
  @Operation(summary = "Listar reservas de un alumno")
  public ResponseEntity<List<ReservaResponseDTO>> listarPorAlumno(@PathVariable Long alumnoId) {
    List<ReservaResponseDTO> list =
        reservaService.listarPorAlumno(alumnoId).stream()
            .map(ReservaResponseDTO::new)
            .collect(Collectors.toList());
    return ResponseEntity.ok(list);
  }

  @GetMapping
  @Operation(summary = "Listar reservas operativas con filtro opcional de estado")
  public ResponseEntity<List<ReservaResponseDTO>> listarTodas(
      @RequestParam(required = false) EstadoReserva estado) {
    List<Reserva> reservas =
        (estado != null) ? reservaService.listarPorEstado(estado) : reservaService.listarTodas();
    List<ReservaResponseDTO> list =
        reservas.stream().map(ReservaResponseDTO::new).collect(Collectors.toList());
    return ResponseEntity.ok(list);
  }

  @PostMapping("/{id}/marcar-lista")
  @Operation(
      summary =
          "Marcar pedido como listo para retiro registrando responsable de preparación y"
              + " notificación")
  public ResponseEntity<ReservaResponseDTO> marcarLista(@PathVariable Long id) {
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(null);
    Reserva r = reservaService.marcarListaParaRetiro(id, actor);
    return ResponseEntity.ok(new ReservaResponseDTO(r));
  }

  @PostMapping("/{id}/cancelar")
  @Operation(
      summary =
          "Cancelar reserva liberando saldo comprometido y stock reservado según rol y estado")
  public ResponseEntity<ReservaResponseDTO> cancelar(
      @PathVariable Long id,
      @Valid @RequestBody CancelarReservaDTO body) {
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(null);
    String rol = cl.edusaldo.ventas.config.ContextoSolicitud.rol();
    Reserva r = reservaService.cancelarReserva(id, body.getMotivo().trim(), actor, rol);
    return ResponseEntity.ok(new ReservaResponseDTO(r));
  }

  @PostMapping("/{id}/entregar")
  @Operation(
      summary =
          "Confirmar retiro de materiales y registrar entrega formal con descuento definitivo")
  public ResponseEntity<EntregaResponseDTO> entregar(@PathVariable Long id) {
    Long actor = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(null);
    Entrega entrega = reservaService.entregarReserva(id, actor);
    return ResponseEntity.status(HttpStatus.CREATED).body(new EntregaResponseDTO(entrega));
  }

  @GetMapping("/notificaciones")
  @Operation(summary = "Consultar bandeja de notificaciones persistentes de reservas")
  public ResponseEntity<List<cl.edusaldo.ventas.dto.NotificacionResponseDTO>>
      listarNotificaciones() {
    String rol = cl.edusaldo.ventas.config.ContextoSolicitud.rol();
    boolean mostrarDestinatario = rol.equals("ADMINISTRADOR") || rol.equals("ENCARGADO");
    return ResponseEntity.ok(
        reservaService.listarNotificaciones().stream()
            .map(n -> new cl.edusaldo.ventas.dto.NotificacionResponseDTO(n, mostrarDestinatario))
            .toList());
  }
}
