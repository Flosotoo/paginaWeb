package cl.edusaldo.productos;

import cl.edusaldo.productos.controller.SaludController;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SaludContratoTest {
  @Test void servicioConBaseDisponibleExponeEstadoComun() {
    JdbcTemplate db = mock(JdbcTemplate.class);
    when(db.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
    assertEquals("UP", new SaludController(db).salud().get("status"));
    verify(db).queryForObject("SELECT 1", Integer.class);
  }
}
