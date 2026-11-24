package cl.edusaldo.auth.controller;

import cl.edusaldo.auth.service.SesionService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class SesionController {
  private final SesionService sesiones;

  public SesionController(SesionService sesiones) {
    this.sesiones = sesiones;
  }

  private static String extraerBearer(String auth) {
    if (auth == null || !auth.startsWith("Bearer ")) return "";
    return auth.substring(7).trim();
  }

  @GetMapping({"/api/auth/sesion", "/internal/sesiones/validar"})
  public Map<String, Object> validar(
      @RequestHeader(value = "Authorization", required = false) String auth) {
    try {
      return sesiones.validar(extraerBearer(auth));
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage(), ex);
    }
  }

  @PostMapping("/api/auth/cerrar-sesion")
  public Map<String, String> cerrar(
      @RequestHeader(value = "Authorization", required = false) String auth) {
    sesiones.revocar(extraerBearer(auth));
    return Map.of("message", "Sesión revocada");
  }
}
