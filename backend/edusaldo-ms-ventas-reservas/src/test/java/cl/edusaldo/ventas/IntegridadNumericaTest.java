package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.model.*;
import org.junit.jupiter.api.Test;

class IntegridadNumericaTest {
  @Test
  void subtotalOverflowIsRejected() {
    assertThrows(
        ArithmeticException.class,
        () -> new DetalleEntrega(null, 1L, "Material", 2, Integer.MAX_VALUE).getSubtotal());
    assertThrows(
        ArithmeticException.class,
        () -> new DetalleReserva(null, 1L, "Material", 2, Integer.MAX_VALUE).getSubtotal());
    assertThrows(
        ArithmeticException.class,
        () ->
            new EntregaResponseDTO.ItemEntregaResponseDTO(
                1L, 1L, "Material", 2, Integer.MAX_VALUE, 0));
    assertThrows(
        ArithmeticException.class,
        () -> new ReservaResponseDTO.ItemReservaResponseDTO(1L, "Material", 2, Integer.MAX_VALUE));
  }

  @Test
  void totalOverflowIsRejectedRatherThanBecomingNegative() {
    Entrega e = new Entrega("E", null, 1L, OrigenEntrega.MESON, 0, 2L);
    e.agregarDetalle(1L, "A", 1, Integer.MAX_VALUE);
    e.agregarDetalle(2L, "B", 1, 1);
    assertThrows(ArithmeticException.class, e::calcularTotal);
    Reserva r = new Reserva("R", 1L, 2L, 0);
    r.agregarDetalle(1L, "A", 1, Integer.MAX_VALUE);
    r.agregarDetalle(2L, "B", 1, 1);
    assertThrows(ArithmeticException.class, r::calcularTotal);
  }
}
