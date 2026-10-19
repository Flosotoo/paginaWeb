package cl.edusaldo.ventas.controller;

import cl.edusaldo.ventas.dto.CrearDevolucionDTO;
import cl.edusaldo.ventas.dto.DevolucionResponseDTO;
import cl.edusaldo.ventas.model.Devolucion;
import cl.edusaldo.ventas.service.DevolucionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/devoluciones")
@Tag(name = "Devoluciones", description = "Registro de devoluciones de materiales y reversión de entregas HU37")
public class DevolucionController {

    private final DevolucionService devolucionService;

    public DevolucionController(DevolucionService devolucionService) {
        this.devolucionService = devolucionService;
    }

    @PostMapping
    @Operation(summary = "HU37: Registrar devolución de materiales y revertir líneas de entrega")
    public ResponseEntity<DevolucionResponseDTO> registrarDevolucion(@Valid @RequestBody CrearDevolucionDTO dto) {
        Devolucion devolucion = devolucionService.registrarDevolucion(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new DevolucionResponseDTO(devolucion));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Consultar devolución por ID")
    public ResponseEntity<DevolucionResponseDTO> obtenerPorId(@PathVariable Long id) {
        Devolucion devolucion = devolucionService.obtenerPorId(id);
        return ResponseEntity.ok(new DevolucionResponseDTO(devolucion));
    }

    @GetMapping("/entrega/{entregaId}")
    @Operation(summary = "Listar devoluciones correspondientes a una entrega")
    public ResponseEntity<List<DevolucionResponseDTO>> listarPorEntrega(@PathVariable Long entregaId) {
        List<DevolucionResponseDTO> list = devolucionService.listarPorEntrega(entregaId).stream()
                .map(DevolucionResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/alumno/{alumnoId}")
    @Operation(summary = "Listar devoluciones de un alumno")
    public ResponseEntity<List<DevolucionResponseDTO>> listarPorAlumno(@PathVariable Long alumnoId) {
        List<DevolucionResponseDTO> list = devolucionService.listarPorAlumno(alumnoId).stream()
                .map(DevolucionResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping
    @Operation(summary = "Listar todas las devoluciones registradas")
    public ResponseEntity<List<DevolucionResponseDTO>> listarTodas() {
        List<DevolucionResponseDTO> list = devolucionService.listarTodas().stream()
                .map(DevolucionResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }
}
