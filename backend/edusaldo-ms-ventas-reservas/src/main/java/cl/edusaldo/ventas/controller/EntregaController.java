package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.EntregaResponseDTO;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.service.EntregaService;
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
@Tag(name = "Entregas", description = "Entregas de materiales por concepto en mesón y por reserva previa")
public class EntregaController {

    private final EntregaService entregaService;

    public EntregaController(EntregaService entregaService) {
        this.entregaService = entregaService;
    }

    @PostMapping("/meson")
    @Operation(summary = "HU34: Registrar entrega directa presencial en mesón")
    public ResponseEntity<EntregaResponseDTO> entregaMeson(@Valid @RequestBody EntregaMesonDTO dto) {
        Entrega entrega = entregaService.registrarEntregaMeson(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new EntregaResponseDTO(entrega));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar entrega por ID")
    public ResponseEntity<EntregaResponseDTO> obtenerPorId(@PathVariable Long id) {
        Entrega entrega = entregaService.obtenerPorId(id);
        return ResponseEntity.ok(new EntregaResponseDTO(entrega));
    }

    @GetMapping("/alumno/{alumnoId}")
    @Operation(summary = "Listar entregas de un alumno")
    public ResponseEntity<List<EntregaResponseDTO>> listarPorAlumno(@PathVariable Long alumnoId) {
        List<EntregaResponseDTO> list = entregaService.listarPorAlumno(alumnoId).stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/historial")
    @Operation(summary = "HU36: Historial de todas las entregas operativas realizadas")
    public ResponseEntity<List<EntregaResponseDTO>> listarHistorial() {
        List<EntregaResponseDTO> list = entregaService.listarHistorial().stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/dia")
    @Operation(summary = "HU36: Entregas realizadas durante el día en curso")
    public ResponseEntity<List<EntregaResponseDTO>> listarDelDia() {
        List<EntregaResponseDTO> list = entregaService.listarDelDia().stream()
                .map(EntregaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping
    @Operation(summary = "Listar todas las entregas")
    public ResponseEntity<List<EntregaResponseDTO>> listarTodas() {
        return listarHistorial();
    }
}
