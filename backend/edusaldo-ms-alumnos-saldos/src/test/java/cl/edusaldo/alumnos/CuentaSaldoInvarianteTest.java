package cl.edusaldo.alumnos;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.CuentaSaldo;
import cl.edusaldo.alumnos.model.MovimientoSaldo;
import cl.edusaldo.alumnos.model.TipoMovimientoSaldo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("MS Saldos · Pruebas de Invariantes de Dominio en CuentaSaldo")
class CuentaSaldoInvarianteTest {

    private CuentaSaldo cuenta;

    @BeforeEach
    void setUp() {
        cuenta = new CuentaSaldo(1L, 10000);
    }

    @Test
    @DisplayName("Invariante de saldo disponible: saldoDisponible == saldoActual - saldoComprometido >= 0")
    void testInvarianteSaldoDisponible() {
        assertEquals(10000, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(10000, cuenta.getSaldoDisponible());
        assertTrue(cuenta.getSaldoDisponible() >= 0);
    }

    @Test
    @DisplayName("Retención por reserva: incrementa saldo comprometido y emite movimiento RESERVA")
    void testRetencionPorReserva() {
        MovimientoSaldo mov = cuenta.retenerSaldoPorReserva(4000, 101L);

        assertEquals(10000, cuenta.getSaldoActual());
        assertEquals(4000, cuenta.getSaldoComprometido());
        assertEquals(6000, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.RESERVA, mov.getTipo());
        assertEquals(4000, mov.getMonto());
        assertEquals(10000, mov.getSaldoResultante());
        assertEquals(101L, mov.getReferenciaId());
    }

    @Test
    @DisplayName("Invariante: rechazo de retención si el monto supera el saldo disponible")
    void testRechazoRetencionSaldoInsuficiente() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                cuenta.retenerSaldoPorReserva(15000, 102L)
        );

        assertTrue(ex.getMessage().contains("Saldo insuficiente"));
        assertEquals(10000, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(10000, cuenta.getSaldoDisponible());
    }

    @Test
    @DisplayName("Liberación de saldo retenido: decrementa comprometido y restaura disponible")
    void testLiberacionSaldoRetenido() {
        cuenta.retenerSaldoPorReserva(4000, 103L);
        MovimientoSaldo mov = cuenta.liberarSaldoRetenido(4000, 103L);

        assertEquals(10000, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(10000, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.LIBERACION_RESERVA, mov.getTipo());
        assertEquals(4000, mov.getMonto());
    }

    @Test
    @DisplayName("Cobro de entrega de reserva: reduce atómicamente saldo comprometido y actual sin doble cobro")
    void testCobroEntregaReservaAtomics() {
        cuenta.retenerSaldoPorReserva(4000, 104L);
        MovimientoSaldo mov = cuenta.cobrarEntregaMateriales(4000, 501L, true);

        assertEquals(6000, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(6000, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.ENTREGA, mov.getTipo());
        assertEquals(4000, mov.getMonto());
        assertEquals(6000, mov.getSaldoResultante());
    }

    @Test
    @DisplayName("Cobro directo en mesón: descuenta del disponible y actual, rechaza si es insuficiente")
    void testCobroEntregaDirectaMeson() {
        MovimientoSaldo mov = cuenta.cobrarEntregaMateriales(3000, 502L, false);

        assertEquals(7000, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(7000, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.ENTREGA, mov.getTipo());

        assertThrows(IllegalStateException.class, () ->
                cuenta.cobrarEntregaMateriales(8000, 503L, false)
        );
    }

    @Test
    @DisplayName("Reembolso por devolución: reintegra dinero a saldo actual y emite movimiento DEVOLUCION")
    void testReembolsoPorDevolucion() {
        MovimientoSaldo mov = cuenta.reembolsarPorDevolucion(2500, 701L);

        assertEquals(12500, cuenta.getSaldoActual());
        assertEquals(12500, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.DEVOLUCION, mov.getTipo());
        assertEquals(2500, mov.getMonto());
    }

    @Test
    @DisplayName("Liquidación por retiro: egresa saldo a 0 y rechaza si existen reservas retenidas")
    void testLiquidacionPorRetiro() {
        cuenta.retenerSaldoPorReserva(2000, 105L);
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                cuenta.liquidarSaldoPorRetiro(4L, "TRANSFERENCIA", "TR-1234", "Retiro institucional")
        );
        assertTrue(ex.getMessage().contains("reservas retenidas pendientes"));

        // Se libera la reserva para poder liquidar
        cuenta.liberarSaldoRetenido(2000, 105L);
        MovimientoSaldo mov = cuenta.liquidarSaldoPorRetiro(4L, "TRANSFERENCIA", "TR-1234", "Retiro institucional");

        assertEquals(0, cuenta.getSaldoActual());
        assertEquals(0, cuenta.getSaldoComprometido());
        assertEquals(0, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.DEVOLUCION_SALDO, mov.getTipo());
        assertEquals(10000, mov.getMonto());
        assertEquals(0, mov.getSaldoResultante());
    }

    @Test
    @DisplayName("Alerta de saldo bajo: detecta cruce hacia abajo de umbral de 3000 CLP")
    void testCruceUmbralSaldoBajo() {
        // Cruce: de 5000 a 2500 -> cruza umbral de 3000 hacia abajo
        cuenta.setSaldoActual(2500);
        assertTrue(cuenta.cruzoUmbralSaldoBajo(5000, 3000));

        // Ya estaba por debajo: de 2500 a 2000 -> no cruza (ya estaba alertado)
        cuenta.setSaldoActual(2000);
        assertFalse(cuenta.cruzoUmbralSaldoBajo(2500, 3000));

        // Por encima: de 6000 a 4000 -> no cruza
        cuenta.setSaldoActual(4000);
        assertFalse(cuenta.cruzoUmbralSaldoBajo(6000, 3000));
    }

    @Test
    @DisplayName("Bloqueo temporal de cuenta: previene concurrencia y se desbloquea correctamente")
    void testBloqueoTemporalYDesbloqueo() {
        assertFalse(cuenta.estaBloqueada());
        assertTrue(cuenta.bloquearTemporalmente(10));
        assertTrue(cuenta.estaBloqueada());

        // Segundo bloqueo concurrente es rechazado
        assertThrows(IllegalStateException.class, () -> cuenta.bloquearTemporalmente(10));

        cuenta.desbloquear();
        assertFalse(cuenta.estaBloqueada());
    }

    @Test
    @DisplayName("Acreditación de abono: incrementa saldo y genera movimiento ABONO")
    void testAcreditarMontoAbonado() {
        Abono abono = Abono.iniciar(4L, 1L, 5000);
        abono.setId(99L);

        MovimientoSaldo mov = cuenta.acreditarMontoAbonado(abono);

        assertEquals(15000, cuenta.getSaldoActual());
        assertEquals(15000, cuenta.getSaldoDisponible());
        assertEquals(TipoMovimientoSaldo.ABONO, mov.getTipo());
        assertEquals(5000, mov.getMonto());
        assertEquals(15000, mov.getSaldoResultante());
    }
}
