package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.ventas.model.*;
import org.junit.jupiter.api.Test;

class DevolucionTest {
  @Test
  void devolucionParcialNoPermiteSuperarCantidadOriginal() {
    DetalleEntrega d = new DetalleEntrega(null, 101L, "Témpera", 2, 2000);
    d.registrarDevolucion(1);
    assertEquals(1, d.getCantidadDevuelta());
    assertThrows(IllegalStateException.class, () -> d.registrarDevolucion(2));
    assertEquals(1, d.getCantidadDevuelta());
    d.registrarDevolucion(1);
    assertEquals(2, d.getCantidadDevuelta());
  }

  @Test
  void reintegroSumaSoloUnidadesDevueltas() {
    Devolucion d = new Devolucion("D", 50L, 10L, "Defecto", 0, 2L);
    d.agregarDetalle(501L, 101L, "Témpera", 1, 2000);
    d.agregarDetalle(502L, 102L, "Lápiz", 2, 300);
    d.registrar();
    assertEquals(2600, d.getTotalReintegro());
    assertEquals(2, d.getDetalles().size());
  }
}
