package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.service.SesionService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
public class SesionController {
  private final SesionService sesiones;

  public SesionController(SesionService sesiones) {
    this.sesiones = sesiones;
  }

  @GetMapping({"/api/auth/sesion", "/internal/sesiones/validar"})
  public Map<String, Object> validar(@RequestHeader("Authorization") String auth) {
    return sesiones.validar(auth.startsWith("Bearer ") ? auth.substring(7) : "");
  }

  @PostMapping("/api/auth/cerrar-sesion")
  public Map<String, String> cerrar(@RequestHeader("Authorization") String auth) {
    sesiones.revocar(auth.startsWith("Bearer ") ? auth.substring(7) : "");
    return Map.of("message", "Sesión revocada");
  }
}
