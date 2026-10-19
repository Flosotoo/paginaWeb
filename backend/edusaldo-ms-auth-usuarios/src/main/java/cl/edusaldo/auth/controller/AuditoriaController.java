package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.model.RegistroAuditoria;
import cl.edusaldo.auth.service.AuditoriaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@Tag(name = "Auditoría", description = "Libro de registro y trazabilidad de eventos sensibles (HU52)")
public class AuditoriaController {

    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    @Operation(summary = "Listar todos los registros de auditoría en orden descendente")
    public ResponseEntity<List<RegistroAuditoria>> listar(
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) String entidad) {
        if (usuarioId != null) {
            return ResponseEntity.ok(auditoriaService.listarPorUsuario(usuarioId));
        }
        if (entidad != null && !entidad.isBlank()) {
            return ResponseEntity.ok(auditoriaService.listarPorEntidad(entidad));
        }
        return ResponseEntity.ok(auditoriaService.listarTodas());
    }
}
