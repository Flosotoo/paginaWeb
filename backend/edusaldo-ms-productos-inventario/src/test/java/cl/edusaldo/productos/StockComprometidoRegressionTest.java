package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.productos.model.*;
import org.junit.jupiter.api.Test;

class StockComprometidoRegressionTest {
  private Producto producto() {
    return new Producto(new Categoria("Textos", ""), "TXT", "Libro", "", "", "1", 100, 10, 2);
  }

  @Test
  void entregaReservadaRegistraAmbasVariaciones() {
    Producto p = producto();
    p.retenerStockPorReserva(4, 11L, 1L);
    MovimientoInventario m = p.descontarStockPorEntrega(4, 22L, true, 1L);
    assertEquals(6, p.getStockFisico());
    assertEquals(0, p.getStockReservado());
    assertEquals(-4, m.getVariacionFisica());
    assertEquals(-4, m.getVariacionReservada());
  }

  @Test
  void noLiberaMasQueLoReservado() {
    Producto p = producto();
    p.retenerStockPorReserva(3, 11L, 1L);
    assertThrows(IllegalStateException.class, () -> p.liberarStockRetenido(4, 11L, 1L));
    assertEquals(3, p.getStockReservado());
  }

  @Test
  void entregaReservadaRechazaCompromisoInsuficienteSinMutar() {
    Producto p = producto();
    p.retenerStockPorReserva(2, 11L, 1L);
    assertThrows(IllegalStateException.class, () -> p.descontarStockPorEntrega(3, 22L, true, 1L));
    assertEquals(10, p.getStockFisico());
    assertEquals(2, p.getStockReservado());
  }

  @Test
  void precioNegativoSeRechazaAntesDeEditar() {
    Producto p = producto();
    assertThrows(IllegalArgumentException.class, () -> p.editar("Libro", "", "", "1", -1, 2, null));
    assertEquals(100, p.getPrecio());
  }
}
