package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.EntregaResponseDTO;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.service.EntregaService;
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
@RequestMapping("/api/entregas")
@Tag(name = "Entregas", description = "Entregas de materiales por concepto en mesón y por reserva previa (HU33-HU35, HU49)")
public class EntregaController {

    private final EntregaService entregaService;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private cl.edusaldo.ventas.service.ReservaService reservaService;

    public EntregaController(EntregaService entregaService) {
        this.entregaService = entregaService;
    }

    @PostMapping("/reserva/{reservaId}")
    @Operation(summary = "HU33 - Confirmar retiro de reserva generando Entrega formal y cobro definitivo")
    public ResponseEntity<EntregaResponseDTO> entregaReserva(
            @PathVariable Long reservaId,
            @RequestParam(required = false, defaultValue = "1") Long encargadoId) {
        if (reservaService == null) {
            throw new IllegalStateException("Servicio de reservas no disponible");
        }
        Entrega entrega = reservaService.entregarReserva(reservaId, encargadoId);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EntregaResponseDTO(entrega));
    }

    @PostMapping("/meson")
    @Operation(summary = "HU34 - Registrar entrega directa presencial en mesón a alumno con saldo disponible")
    public ResponseEntity<EntregaResponseDTO> entregaMeson(@Valid @RequestBody EntregaMesonDTO dto) {
        Entrega entrega = entregaService.registrarEntregaMeson(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EntregaResponseDTO(entrega));
    }

    @GetMapping("/{id}")
    @Operation(summary = "HU35 - Consultar entrega por ID")
    public ResponseEntity<EntregaResponseDTO> obtenerPorId(@PathVariable Long id) {
        Entrega entrega = entregaService.obtenerPorId(id);
        return ResponseEntity.ok(new EntregaResponseDTO(entrega));
    }

    @GetMapping("/alumno/{alumnoId}")
    @Operation(summary = "HU35 - Listar entregas realizadas a un alumno")
    public ResponseEntity<List<EntregaResponseDTO>> listarPorAlumno(@PathVariable Long alumnoId) {
        List<EntregaResponseDTO> list = entregaService.listarPorAlumno(alumnoId).stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/historial")
    @Operation(summary = "HU35 / HU49 - Historial de todas las entregas operativas realizadas")
    public ResponseEntity<List<EntregaResponseDTO>> listarHistorial() {
        List<EntregaResponseDTO> list = entregaService.listarHistorial().stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/dia")
    @Operation(summary = "HU35 - Entregas realizadas durante el día en curso")
    public ResponseEntity<List<EntregaResponseDTO>> listarDelDia() {
        List<EntregaResponseDTO> list = entregaService.listarDelDia().stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @Hidden
    @GetMapping
    public ResponseEntity<List<EntregaResponseDTO>> listarTodas() {
        return listarHistorial();
    }
}
