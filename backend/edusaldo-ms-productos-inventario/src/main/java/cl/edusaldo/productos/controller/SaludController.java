package cl.edusaldo.productos.controller;

import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
public class SaludController {
  private final JdbcTemplate jdbc;

  public SaludController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/internal/salud")
  public Map<String, Object> salud() {
    jdbc.queryForObject("SELECT 1", Integer.class);
    return Map.of("status", "UP");
  }
}
