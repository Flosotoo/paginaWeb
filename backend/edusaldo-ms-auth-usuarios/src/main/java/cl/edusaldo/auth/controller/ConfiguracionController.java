package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.ConfiguracionDTO;
import cl.edusaldo.auth.model.ConfiguracionInstitucional;
import cl.edusaldo.auth.service.ConfiguracionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/configuracion")
@Tag(name = "Configuración Institucional", description = "Datos institucionales del establecimiento y librería (HU50)")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;

    public ConfiguracionController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    @Operation(summary = "Consultar datos institucionales del colegio y la librería")
    public ResponseEntity<ConfiguracionInstitucional> obtener() {
        return ResponseEntity.ok(configuracionService.obtenerConfiguracion());
    }

    @PutMapping
    @Operation(summary = "Actualizar datos institucionales (solo Administrador)")
    public ResponseEntity<ConfiguracionInstitucional> actualizar(
            @RequestBody ConfiguracionDTO dto,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        return ResponseEntity.ok(configuracionService.actualizarConfiguracion(dto, adminId));
    }
}
