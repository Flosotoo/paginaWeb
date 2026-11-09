package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;
import cl.edusaldo.ventas.model.NotificacionPendiente;
import cl.edusaldo.ventas.model.Reserva;
import org.junit.jupiter.api.Test;

class ContenidoNotificacionTest {
  @Test
  void confirmacionDetallaReservaSinPresentarlaComoEntrega() {
    Reserva reserva = new Reserva("RES-123", 4L, 3L, 3500);
    reserva.agregarDetalle(1L, "Cuaderno", 2, 1000);
    reserva.agregarDetalle(2L, "Lápiz", 1, 1500);
    NotificacionPendiente aviso = NotificacionPendiente.pendiente(1L, null, 4L, "RESERVA", 1L);
    aviso.detallarReserva(reserva);
    assertTrue(aviso.getMensaje().contains("RES-123"));
    assertTrue(aviso.getMensaje().contains("Cuaderno") && aviso.getMensaje().contains("2"));
    assertTrue(aviso.getMensaje().contains("Lápiz") && aviso.getMensaje().contains("1"));
    assertTrue(aviso.getMensaje().contains("3500"));
    assertTrue(aviso.getMensaje().contains("aún no se han entregado"));
  }

  @Test
  void confirmacionNoTruncaReservasConMuchasLineas() {
    Reserva reserva = new Reserva("RES-LARGA", 4L, 3L, 100);
    for (long i = 1; i <= 100; i++) reserva.agregarDetalle(i, "Material número " + i, 1, 1);
    NotificacionPendiente aviso = NotificacionPendiente.pendiente(2L, null, 4L, "RESERVA", 1L);
    aviso.detallarReserva(reserva);
    assertTrue(aviso.getMensaje().length() > 1000);
    assertTrue(aviso.getMensaje().contains("Material número 100 · cantidad 1"));
  }
}
