package cl.edusaldo.ventas.controller;

import java.sql.*;
import java.util.Map;
import javax.sql.DataSource;
import org.springframework.web.bind.annotation.*;

@RestController
public class SaludController {
  private final DataSource dataSource;

  public SaludController(DataSource dataSource) {
    this.dataSource = dataSource;
  }

  @GetMapping("/internal/salud")
  public Map<String, String> salud() throws SQLException {
    try (Connection c = dataSource.getConnection();
        Statement s = c.createStatement()) {
      s.execute("SELECT 1");
      return Map.of("status", "UP");
    }
  }
}
