package cl.edusaldo.alumnos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.*;
import cl.edusaldo.alumnos.service.SaldoService;
import java.util.Optional;
import org.junit.jupiter.api.*;

class AbonoRechazadoRegressionTest {
  @org.junit.jupiter.api.AfterEach
  void limpiarContexto() {
    cl.edusaldo.alumnos.config.RequestContext.clear();
  }

  @AfterEach
  void clear() {
    RequestContext.clear();
  }

  @Test
  void rechazoNoAcreditaYEsFinal() {
    RequestContext.set(new RequestContext(1L, 2L, "APODERADO", "gateway", 3000));
    var cuentas = mock(CuentaSaldoRepository.class);
    var movimientos = mock(MovimientoSaldoRepository.class);
    var abonos = mock(AbonoRepository.class);
    var servicio = new SaldoService(cuentas, movimientos, abonos);
    var abono = Abono.iniciar(2L, 3L, 500);
    var cuenta = new CuentaSaldo(3L, 100, 0);
    when(abonos.findByTokenTransaccionAndIdEstablecimiento(abono.getTokenTransaccion(), 1L))
        .thenReturn(Optional.of(abono));
    when(cuentas.findByAlumnoIdAndIdEstablecimiento(3L, 1L)).thenReturn(Optional.of(cuenta));
    when(abonos.save(any())).thenAnswer(i -> i.getArgument(0));
    when(cuentas.save(any())).thenAnswer(i -> i.getArgument(0));
    var dto = new ConfirmarAbonoDTO(abono.getTokenTransaccion());
    dto.setResultadoSimulado("RECHAZADO");
    servicio.confirmarAbono(dto);
    assertEquals(EstadoAbono.RECHAZADO, abono.getEstado());
    assertEquals(100, cuenta.getSaldoActual());
    assertFalse(cuenta.estaBloqueada());
    verify(movimientos, never()).save(any());
  }
}
