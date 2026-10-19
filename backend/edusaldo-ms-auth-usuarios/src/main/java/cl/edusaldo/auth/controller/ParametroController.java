package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.ParametroDTO;
import cl.edusaldo.auth.model.ParametroSistema;
import cl.edusaldo.auth.service.ConfiguracionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parametros")
@Tag(name = "Parámetros del Sistema", description = "Parámetros operativos y umbrales configurables (HU51)")
public class ParametroController {

    private final ConfiguracionService configuracionService;

    public ParametroController(ConfiguracionService configuracionService) {
        this.configuracionService = configuracionService;
    }

    @GetMapping
    @Operation(summary = "Listar todos los parámetros operativos del sistema")
    public ResponseEntity<List<ParametroSistema>> listar() {
        return ResponseEntity.ok(configuracionService.listarParametros());
    }

    @GetMapping("/{clave}")
    @Operation(summary = "Consultar valor de un parámetro por su clave")
    public ResponseEntity<ParametroSistema> obtener(@PathVariable String clave) {
        return ResponseEntity.ok(configuracionService.obtenerParametro(clave));
    }

    @PutMapping("/{clave}")
    @Operation(summary = "Modificar el valor de un parámetro del sistema")
    public ResponseEntity<ParametroSistema> modificar(
            @PathVariable String clave,
            @RequestBody Map<String, String> payload,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        String valor = payload.get("valor");
        if (valor == null) {
            throw new IllegalArgumentException("El campo valor es obligatorio");
        }
        return ResponseEntity.ok(configuracionService.modificarParametro(clave, valor, adminId));
    }
}
