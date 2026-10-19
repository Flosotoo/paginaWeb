package cl.edusaldo.alumnos;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.EstadoAbono;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("MS Saldos · Pruebas de Pasarela Simulada y Ciclo de Vida de Abono")
class AbonoPasarelaTest {

    @Test
    @DisplayName("Iniciar abono: genera estado PENDIENTE, token UUID válido y expiración en 15 minutos")
    void testIniciarAbonoExitoso() {
        Abono abono = Abono.iniciar(4L, 1L, 10000);

        assertNotNull(abono.getTokenTransaccion());
        assertFalse(abono.getTokenTransaccion().isBlank());
        assertEquals(EstadoAbono.PENDIENTE, abono.getEstado());
        assertEquals(4L, abono.getApoderadoId());
        assertEquals(1L, abono.getAlumnoId());
        assertEquals(10000, abono.getMonto());
        assertNotNull(abono.getFechaCreacion());
        assertNotNull(abono.getExpiraEn());

        // Debe expirar ~15 minutos en el futuro
        assertTrue(abono.getExpiraEn().isAfter(LocalDateTime.now().plusMinutes(14)));
        assertTrue(abono.estaVigente());
    }

    @Test
    @DisplayName("Rechazo al iniciar abono con monto no positivo")
    void testIniciarAbonoMontoInvalido() {
        assertThrows(IllegalArgumentException.class, () -> Abono.iniciar(4L, 1L, 0));
        assertThrows(IllegalArgumentException.class, () -> Abono.iniciar(4L, 1L, -5000));
    }

    @Test
    @DisplayName("Verificación de token: valida coincidencia exacta y vigencia temporal")
    void testVerificarToken() {
        Abono abono = Abono.iniciar(4L, 1L, 7000);
        String token = abono.getTokenTransaccion();

        assertTrue(abono.verificarToken(token));
        assertFalse(abono.verificarToken("TOKEN-INCORRECTO"));
        assertFalse(abono.verificarToken(null));
        assertFalse(abono.verificarToken(""));
    }

    @Test
    @DisplayName("Aprobar abono: transición a APROBADO y registro de fecha de resolución")
    void testAprobarAbono() {
        Abono abono = Abono.iniciar(4L, 1L, 8000);
        String token = abono.getTokenTransaccion();

        abono.aprobar(token);

        assertEquals(EstadoAbono.APROBADO, abono.getEstado());
        assertNotNull(abono.getFechaResolucion());
        // Ya no es verificable para una segunda aprobación
        assertFalse(abono.verificarToken(token));
    }

    @Test
    @DisplayName("Rechazar abono: transición a RECHAZADO")
    void testRechazarAbono() {
        Abono abono = Abono.iniciar(4L, 1L, 6000);
        String token = abono.getTokenTransaccion();

        abono.rechazar(token);

        assertEquals(EstadoAbono.RECHAZADO, abono.getEstado());
        assertNotNull(abono.getFechaResolucion());
        assertFalse(abono.verificarToken(token));
    }

    @Test
    @DisplayName("Expiración de abono: si expiraEn está en el pasado, marca EXPIRADO y no verifica")
    void testAbonoExpirado() {
        Abono abono = Abono.iniciar(4L, 1L, 5000);
        // Forzar fecha de expiración en el pasado
        abono.setExpiraEn(LocalDateTime.now().minusMinutes(1));

        assertFalse(abono.estaVigente());
        assertEquals(EstadoAbono.EXPIRADO, abono.getEstado());
        assertFalse(abono.verificarToken(abono.getTokenTransaccion()));

        assertThrows(IllegalStateException.class, () -> abono.aprobar(abono.getTokenTransaccion()));
    }
}
