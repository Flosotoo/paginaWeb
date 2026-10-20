package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.NotificacionPendiente;
import cl.edusaldo.ventas.model.Reserva;
import cl.edusaldo.ventas.service.ReservaService;
import io.swagger.v3.oas.annotations.Hidden;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reservas")
@Tag(name = "Reservas", description = "Ciclo de reserva con trazabilidad HU31 CA2, preparación, retiro y notificaciones (HU25-HU33)")
public class ReservaController {

    private final ReservaService reservaService;

    public ReservaController(ReservaService reservaService) {
        this.reservaService = reservaService;
    }

    @PostMapping
    @Operation(summary = "HU27 - Crear nueva reserva de materiales con validación S01-S04 (Apoderado o Alumno >= 12 años)")
    public ResponseEntity<ReservaResponseDTO> crear(@Valid @RequestBody CrearReservaDTO dto) {
        Reserva r = reservaService.crearReserva(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ReservaResponseDTO(r));
    }

    @GetMapping("/{id}")
    @Operation(summary = "HU29 - Consultar reserva por ID")
    public ResponseEntity<ReservaResponseDTO> obtenerPorId(@PathVariable Long id) {
        Reserva r = reservaService.obtenerPorId(id);
        return ResponseEntity.ok(new ReservaResponseDTO(r));
    }

    @GetMapping("/alumno/{alumnoId}")
    @Operation(summary = "HU29 - Listar reservas de un alumno")
    public ResponseEntity<List<ReservaResponseDTO>> listarPorAlumno(@PathVariable Long alumnoId) {
        List<ReservaResponseDTO> list = reservaService.listarPorAlumno(alumnoId).stream()
                .map(ReservaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping
    @Operation(summary = "HU30 - Listar reservas operativas con filtro opcional de estado")
    public ResponseEntity<List<ReservaResponseDTO>> listarTodas(@RequestParam(required = false) EstadoReserva estado) {
        List<Reserva> reservas = (estado != null) ? reservaService.listarPorEstado(estado) : reservaService.listarTodas();
        List<ReservaResponseDTO> list = reservas.stream()
                .map(ReservaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping({"/{id}/marcar-lista", "/{id}/preparar"})
    @Operation(summary = "HU31 CA2 / A01 - Marcar pedido como listo para retiro (registra preparadaPorId, fecha y notificación)")
    public ResponseEntity<ReservaResponseDTO> marcarLista(
            @PathVariable Long id,
            @RequestBody(required = false) MarcarListaDTO body,
            @RequestParam(required = false) Long encargadoId) {

        Long finalEncargadoId = (body != null && body.getEncargadoId() != null) ? body.getEncargadoId() : encargadoId;
        if (finalEncargadoId == null) {
            throw new IllegalArgumentException("El ID del encargado que prepara el pedido es obligatorio.");
        }

        Reserva r = reservaService.marcarListaParaRetiro(id, finalEncargadoId);
        return ResponseEntity.ok(new ReservaResponseDTO(r));
    }

    @Hidden
    @PutMapping({"/{id}/marcar-lista", "/{id}/preparar"})
    public ResponseEntity<ReservaResponseDTO> marcarListaPut(
            @PathVariable Long id,
            @RequestBody(required = false) MarcarListaDTO body,
            @RequestParam(required = false) Long encargadoId) {
        return marcarLista(id, body, encargadoId);
    }

    @PostMapping("/{id}/cancelar")
    @Operation(summary = "HU28 / HU32 / A02 - Cancelar reserva (APO/ALU solo en PENDIENTE; ENC/ADMIN en PENDIENTE o LISTA_PARA_RETIRO)")
    public ResponseEntity<ReservaResponseDTO> cancelar(
            @PathVariable Long id,
            @RequestBody(required = false) CancelarReservaDTO body,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long encargadoId,
            @RequestParam(required = false) String motivo,
            @RequestParam(required = false) String rol) {

        String finalMotivo = (body != null && body.getMotivo() != null) ? body.getMotivo() : motivo;
        Long finalUsuarioId = (body != null && body.getUsuarioId() != null) ? body.getUsuarioId() : (usuarioId != null ? usuarioId : encargadoId);
        String finalRol = (body != null && body.getRol() != null) ? body.getRol() : rol;

        if (finalMotivo == null || finalMotivo.isBlank()) {
            finalMotivo = "Cancelación solicitada por usuario";
        }
        if (finalUsuarioId == null) {
            finalUsuarioId = 0L;
        }

        Reserva r = reservaService.cancelarReserva(id, finalMotivo, finalUsuarioId, finalRol);
        return ResponseEntity.ok(new ReservaResponseDTO(r));
    }

    @Hidden
    @PutMapping("/{id}/cancelar")
    public ResponseEntity<ReservaResponseDTO> cancelarPut(
            @PathVariable Long id,
            @RequestBody(required = false) CancelarReservaDTO body,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) Long encargadoId,
            @RequestParam(required = false) String motivo,
            @RequestParam(required = false) String rol) {
        return cancelar(id, body, usuarioId, encargadoId, motivo, rol);
    }

    @PostMapping("/{id}/entregar")
    @Operation(summary = "HU33 - Retiro de materiales y confirmación de Entrega formal con descuento S07 y S08")
    public ResponseEntity<EntregaResponseDTO> entregar(
            @PathVariable Long id,
            @RequestBody(required = false) ConfirmarEntregaDTO body,
            @RequestParam(required = false) Long encargadoId) {

        Long finalEncargadoId = (body != null && body.getEncargadoId() != null) ? body.getEncargadoId() : encargadoId;
        if (finalEncargadoId == null) {
            finalEncargadoId = 1L;
        }

        Entrega entrega = reservaService.entregarReserva(id, finalEncargadoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EntregaResponseDTO(entrega));
    }

    @GetMapping("/notificaciones")
    @Operation(summary = "A01 / A02 / F5 - Consultar bandeja de notificaciones persistentes de reservas")
    public ResponseEntity<List<NotificacionPendiente>> listarNotificaciones() {
        return ResponseEntity.ok(reservaService.listarNotificaciones());
    }
}
