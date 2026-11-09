package cl.edusaldo.ventas.service;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.ventas.model.Reserva;
import org.junit.jupiter.api.Test;

class ReservaCompensacionTest {
  @Test
  void confirmacionCalculaCadaLineaYTotalExacto() {
    Reserva r = new Reserva("R", 4L, 3L, 0);
    r.agregarDetalle(1L, "Cuaderno", 2, 1500);
    r.agregarDetalle(2L, "Lápiz", 3, 300);
    r.confirmar();
    assertEquals(3900, r.getTotal());
    assertEquals(3000, r.getDetalles().get(0).getSubtotal());
    assertEquals(900, r.getDetalles().get(1).getSubtotal());
  }
}
