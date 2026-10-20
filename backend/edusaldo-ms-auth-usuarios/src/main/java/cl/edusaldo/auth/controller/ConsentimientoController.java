package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.ConsentimientoDTO;
import cl.edusaldo.auth.model.ConsentimientoPrivacidad;
import cl.edusaldo.auth.service.ConsentimientoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consentimiento")
@Tag(name = "Consentimiento de Privacidad", description = "Aceptación de términos y aviso de privacidad (HU56)")
public class ConsentimientoController {

    private final ConsentimientoService consentimientoService;

    public ConsentimientoController(ConsentimientoService consentimientoService) {
        this.consentimientoService = consentimientoService;
    }

    @PostMapping
    @Operation(summary = "Registrar aceptación de aviso de privacidad")
    public ResponseEntity<ConsentimientoPrivacidad> registrar(@Valid @RequestBody ConsentimientoDTO dto) {
        ConsentimientoPrivacidad res = consentimientoService.registrarConsentimiento(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/usuario/{usuarioId}")
    @Operation(summary = "Consultar historial de consentimientos por usuario")
    public ResponseEntity<List<ConsentimientoPrivacidad>> listarPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(consentimientoService.listarPorUsuario(usuarioId));
    }
}
