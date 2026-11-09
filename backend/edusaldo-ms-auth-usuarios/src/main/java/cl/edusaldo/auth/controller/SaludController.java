package cl.edusaldo.auth.controller;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
public class SaludController {
  private final JdbcTemplate db;

  public SaludController(JdbcTemplate db) {
    this.db = db;
  }

  @GetMapping("/internal/salud")
  public Map<String, String> salud() {
    db.queryForObject("SELECT 1", Integer.class);
    if (db.queryForObject(
            "SELECT COUNT(*) FROM configuracion_institucional WHERE activo = true", Integer.class)
        == 0)
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Configuración pendiente");
    return Map.of("status", "UP");
  }
}
