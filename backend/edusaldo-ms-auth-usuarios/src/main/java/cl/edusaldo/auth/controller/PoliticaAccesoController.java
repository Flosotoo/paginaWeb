package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.dto.PoliticaAccesoDTO;
import cl.edusaldo.auth.model.PoliticaAcceso;
import cl.edusaldo.auth.service.PoliticaAccesoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/politica-acceso")
@Tag(name = "Política de Acceso", description = "Reglas de bloqueo dinámico y tiempos de vigencia (HU10 y HU53)")
public class PoliticaAccesoController {

    private final PoliticaAccesoService politicaAccesoService;

    public PoliticaAccesoController(PoliticaAccesoService politicaAccesoService) {
        this.politicaAccesoService = politicaAccesoService;
    }

    @GetMapping
    @Operation(summary = "Consultar política de acceso vigente")
    public ResponseEntity<PoliticaAcceso> obtener() {
        return ResponseEntity.ok(politicaAccesoService.obtenerPolitica());
    }

    @PutMapping
    @Operation(summary = "Modificar parámetros de la política de acceso (solo Administrador)")
    public ResponseEntity<PoliticaAcceso> modificar(
            @RequestBody PoliticaAccesoDTO dto,
            @RequestParam(required = false, defaultValue = "1") Long adminId) {
        return ResponseEntity.ok(politicaAccesoService.modificarPolitica(dto, adminId));
    }
}
