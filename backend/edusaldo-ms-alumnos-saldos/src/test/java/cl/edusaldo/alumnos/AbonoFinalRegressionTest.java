package cl.edusaldo.alumnos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.*;
import cl.edusaldo.alumnos.service.SaldoService;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class AbonoFinalRegressionTest {
  @org.junit.jupiter.api.AfterEach
  void limpiarContexto() {
    cl.edusaldo.alumnos.config.RequestContext.clear();
  }

  @org.junit.jupiter.api.BeforeEach
  void context() {
    cl.edusaldo.alumnos.config.RequestContext.set(
        new cl.edusaldo.alumnos.config.RequestContext(1L, 2L, "APODERADO", "gateway", 3000));
  }

  @Test
  void aprobadoExpiradoSigueConfirmandoSinAcreditarDeNuevo() {
    CuentaSaldoRepository cuentas = mock(CuentaSaldoRepository.class);
    MovimientoSaldoRepository movimientos = mock(MovimientoSaldoRepository.class);
    AbonoRepository abonos = mock(AbonoRepository.class);
    SaldoService servicio = new SaldoService(cuentas, movimientos, abonos);
    Abono abono = Abono.iniciar(2L, 3L, 500);
    abono.aprobar();
    abono.setFechaCreacion(LocalDateTime.now().minusDays(1));
    abono.setExpiraEn(LocalDateTime.now().minusDays(1));
    when(abonos.findByTokenTransaccionAndIdEstablecimiento(abono.getTokenTransaccion(), 1L))
        .thenReturn(Optional.of(abono));
    CuentaSaldo cuenta = new CuentaSaldo(3L, 500, 0);
    when(cuentas.findByAlumnoIdAndIdEstablecimiento(3L, 1L)).thenReturn(Optional.of(cuenta));
    assertDoesNotThrow(
        () -> servicio.confirmarAbono(new ConfirmarAbonoDTO(abono.getTokenTransaccion())));
    assertEquals(500, cuenta.getSaldoActual());
    verify(movimientos, never()).save(any());
  }

  @Test
  void cuentaRechazaSaldoDisponibleNegativoEnConstruccion() {
    assertThrows(IllegalArgumentException.class, () -> new CuentaSaldo(3L, 100, 200));
    assertThrows(IllegalArgumentException.class, () -> new CuentaSaldo(3L, -1));
  }
}
