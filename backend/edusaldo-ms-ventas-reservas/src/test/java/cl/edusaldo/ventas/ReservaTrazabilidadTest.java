package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.ventas.model.*;
import org.junit.jupiter.api.Test;

class ReservaTrazabilidadTest {
  Reserva reserva() {
    Reserva r = new Reserva("R", 4L, 3L, 2500);
    r.setId(101L);
    r.agregarDetalle(9L, "Cuaderno", 2, 1250);
    return r;
  }

  @Test
  void prepararConservaResponsableYFecha() {
    Reserva r = reserva();
    r.marcarListaParaRetiro(2L);
    assertEquals(EstadoReserva.LISTA_PARA_RETIRO, r.getEstado());
    assertEquals(2L, r.getPreparadaPorId());
    assertNotNull(r.getFechaPreparacion());
    assertThrows(IllegalStateException.class, () -> r.marcarListaParaRetiro(3L));
  }

  @Test
  void retiroGeneraEntregaYBloqueaCancelacion() {
    Reserva r = reserva();
    r.marcarListaParaRetiro(2L);
    Entrega e = r.confirmarRetiroYGenerarEntrega(2L);
    assertEquals(EstadoReserva.ENTREGADA, r.getEstado());
    assertEquals(OrigenEntrega.RESERVA, e.getOrigen());
    assertEquals(101L, e.getReservaId());
    assertEquals(2500, e.getTotal());
    assertEquals(2, e.getDetalles().get(0).getCantidad());
    assertThrows(IllegalStateException.class, () -> r.cancelar("Tarde", 2L, "ENCARGADO"));
  }

  @Test
  void familiaSoloCancelaPendientes() {
    for (String rol : java.util.List.of("APODERADO", "ALUMNO")) {
      Reserva r = reserva();
      r.cancelar("Desiste", 4L, rol);
      assertEquals(EstadoReserva.CANCELADA, r.getEstado());
      assertEquals(4L, r.getCanceladaPorId());
      Reserva lista = reserva();
      lista.marcarListaParaRetiro(2L);
      assertThrows(IllegalStateException.class, () -> lista.cancelar("Tarde", 4L, rol));
      assertEquals(EstadoReserva.LISTA_PARA_RETIRO, lista.getEstado());
    }
  }

  @Test
  void staffCancelaReservaPreparada() {
    for (String rol : java.util.List.of("ENCARGADO", "ADMINISTRADOR")) {
      Reserva r = reserva();
      r.marcarListaParaRetiro(2L);
      r.cancelar("Falta material", 2L, rol);
      assertEquals(EstadoReserva.CANCELADA, r.getEstado());
      assertThrows(IllegalStateException.class, () -> r.confirmarRetiroYGenerarEntrega(2L));
    }
  }
}
