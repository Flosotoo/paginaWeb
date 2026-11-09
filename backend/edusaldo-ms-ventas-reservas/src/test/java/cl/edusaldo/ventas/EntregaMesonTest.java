package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.ventas.model.*;
import java.util.List;
import org.junit.jupiter.api.Test;

class EntregaMesonTest {
  @Test
  void entregaMesonCalculaTotalExactoSinReserva() {
    Entrega e =
        Entrega.registrarEnMeson(
            8L,
            2L,
            List.of(
                new DetalleEntrega(null, 20L, "Lápiz", 4, 300),
                new DetalleEntrega(null, 21L, "Destacador", 2, 750)));
    assertEquals(2700, e.getTotal());
    assertEquals(OrigenEntrega.MESON, e.getOrigen());
    assertNull(e.getReservaId());
    assertEquals(8L, e.getAlumnoId());
    assertEquals(2L, e.getEncargadoId());
    assertEquals(2, e.getDetalles().size());
  }
}
