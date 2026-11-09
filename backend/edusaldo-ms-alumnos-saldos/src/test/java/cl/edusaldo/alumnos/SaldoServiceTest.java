package cl.edusaldo.alumnos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.AbonoRepository;
import cl.edusaldo.alumnos.repository.CuentaSaldoRepository;
import cl.edusaldo.alumnos.repository.MovimientoSaldoRepository;
import cl.edusaldo.alumnos.service.SaldoService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("MS Saldos · Pruebas Unitarias de SaldoService")
class SaldoServiceTest {
  @org.junit.jupiter.api.AfterEach
  void limpiarContexto() {
    cl.edusaldo.alumnos.config.RequestContext.clear();
  }

  @Mock private CuentaSaldoRepository cuentaSaldoRepository;

  @Mock private MovimientoSaldoRepository movimientoSaldoRepository;

  @Mock private AbonoRepository abonoRepository;

  @InjectMocks private SaldoService saldoService;

  private CuentaSaldo cuentaPrueba;

  @Test
  void reportePorAlumnoConservaMovimientosYRechazaOtrosRoles() {
    var desde = java.time.LocalDate.of(2026, 1, 1);
    var hasta = java.time.LocalDate.of(2026, 1, 31);
    var entrega = new MovimientoSaldo(cuentaPrueba, TipoMovimientoSaldo.ENTREGA, 1500, 8500, 5L, "Entrega");
    var devolucion = new MovimientoSaldo(cuentaPrueba, TipoMovimientoSaldo.DEVOLUCION, 500, 9000, 6L, "Devolución");
    when(cuentaSaldoRepository.findAllByIdEstablecimiento(1L)).thenReturn(java.util.List.of(cuentaPrueba));
    when(movimientoSaldoRepository.buscarPeriodo(1L, desde.atStartOfDay(), hasta.plusDays(1).atStartOfDay()))
        .thenReturn(java.util.List.of(entrega, devolucion));
    var reporte = saldoService.reportePorAlumno(desde, hasta);
    assertEquals(1, reporte.size());
    assertEquals(1L, reporte.get(0).cuenta().getAlumnoId());
    assertEquals(10000, reporte.get(0).cuenta().getSaldoDisponible());
    assertEquals(java.util.List.of(TipoMovimientoSaldo.ENTREGA, TipoMovimientoSaldo.DEVOLUCION),
        reporte.get(0).movimientos().stream().map(MovimientoSaldoDTO::getTipo).toList());
    assertThrows(IllegalArgumentException.class, () -> saldoService.reportePorAlumno(hasta, desde));
    assertThrows(IllegalArgumentException.class,
        () -> saldoService.obtenerResumenPeriodo(1L, desde, java.time.LocalDate.MAX));
    cl.edusaldo.alumnos.config.RequestContext.set(new cl.edusaldo.alumnos.config.RequestContext(1L, 4L, "ENCARGADO", "gateway", 3000));
    assertThrows(SecurityException.class, () -> saldoService.reportePorAlumno(desde, hasta));
    assertThrows(SecurityException.class, () -> saldoService.listarAbonos(null, null));
  }

  @BeforeEach
  void setUp() {
    cl.edusaldo.alumnos.config.RequestContext.set(
        new cl.edusaldo.alumnos.config.RequestContext(1L, 4L, "ADMINISTRADOR", "ventas", 3000));
    cuentaPrueba = new CuentaSaldo(1L, 10000, 0);
    cuentaPrueba.setId(10L);
  }

  @Test
  @DisplayName("1. Rechazo de retención si el saldo disponible es insuficiente")
  void testRechazoCompromisoSaldoInsuficiente() {
    when(cuentaSaldoRepository.findByAlumnoIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-01")).thenReturn(false);

    RetenerSaldoDTO dto = new RetenerSaldoDTO(1L, 15000, 101L);
    dto.setReferenciaUnica("KEY-01");

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> saldoService.retenerSaldo(dto));
    assertTrue(ex.getMessage().contains("Saldo insuficiente"));
    assertEquals(10000, cuentaPrueba.getSaldoActual());
    assertEquals(0, cuentaPrueba.getSaldoComprometido());
    assertEquals(10000, cuentaPrueba.getSaldoDisponible());
  }

  @Test
  @DisplayName("2. Retención de saldo incrementa saldo comprometido y reduce disponible")
  void testRetencionSaldoIncrementaComprometidoYReduceDisponible() {
    when(cuentaSaldoRepository.findByAlumnoIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-02")).thenReturn(false);
    when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
    when(movimientoSaldoRepository.save(any(MovimientoSaldo.class)))
        .thenAnswer(
            i -> {
              MovimientoSaldo m = i.getArgument(0);
              m.setId(1L);
              return m;
            });

    RetenerSaldoDTO dto = new RetenerSaldoDTO(1L, 4000, 102L);
    dto.setReferenciaUnica("KEY-02");

    MovimientoSaldoDTO res = saldoService.retenerSaldo(dto);

    assertNotNull(res);
    assertEquals(TipoMovimientoSaldo.RESERVA, res.getTipo());
    assertEquals(4000, res.getMonto());
    assertEquals(10000, cuentaPrueba.getSaldoActual());
    assertEquals(4000, cuentaPrueba.getSaldoComprometido());
    assertEquals(6000, cuentaPrueba.getSaldoDisponible());
  }

  @Test
  @DisplayName("3. Cobro de entrega de reserva reduce comprometido y actual sin duplicidad")
  void testCobrarEntregaReservaReduceComprometidoYActualSinDuplicidad() {
    cuentaPrueba.retenerSaldoPorReserva(4000, 103L);
    assertEquals(6000, cuentaPrueba.getSaldoDisponible());

    when(cuentaSaldoRepository.findByAlumnoIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-03")).thenReturn(false);
    when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
    when(movimientoSaldoRepository.save(any(MovimientoSaldo.class)))
        .thenAnswer(
            i -> {
              MovimientoSaldo m = i.getArgument(0);
              m.setId(2L);
              return m;
            });

    CobrarSaldoDTO dto = new CobrarSaldoDTO(1L, 4000, 501L, true);
    dto.setReferenciaUnica("KEY-03");
    dto.setReservaId(103L);

    CobrarSaldoResponseDTO res = saldoService.cobrarEntrega(dto);

    assertNotNull(res);
    assertEquals(4000, res.getMontoCobrado());
    assertEquals(0, cuentaPrueba.getSaldoComprometido());
    assertEquals(6000, cuentaPrueba.getSaldoActual());
    assertEquals(6000, cuentaPrueba.getSaldoDisponible());
    assertFalse(res.isAlertaSaldoBajo()); // 6000 > 3000
  }

  @Test
  @DisplayName("4. Cobro que cruza umbral bajo (<= 3000 CLP) activa alertaSaldoBajo")
  void testCobroActivaAlertaSaldoBajo() {
    when(cuentaSaldoRepository.findByAlumnoIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
    when(movimientoSaldoRepository.save(any(MovimientoSaldo.class)))
        .thenAnswer(
            i -> {
              MovimientoSaldo m = i.getArgument(0);
              m.setId(3L);
              return m;
            });

    CobrarSaldoDTO dto = new CobrarSaldoDTO(1L, 7500, 502L, false);

    CobrarSaldoResponseDTO res = saldoService.cobrarEntrega(dto);

    assertNotNull(res);
    assertEquals(2500, res.getSaldoActual());
    assertTrue(res.isAlertaSaldoBajo());
  }

  @Test
  @DisplayName("5. Ciclo de Abono: iniciar genera referencia y confirmar acredita")
  void testCicloAbonoIniciarYConfirmar() {
    when(cuentaSaldoRepository.findByAlumnoIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(abonoRepository.save(any(Abono.class)))
        .thenAnswer(
            i -> {
              Abono a = i.getArgument(0);
              a.setId(50L);
              return a;
            });
    when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
    when(movimientoSaldoRepository.save(any(MovimientoSaldo.class)))
        .thenAnswer(
            i -> {
              MovimientoSaldo m = i.getArgument(0);
              m.setId(10L);
              return m;
            });

    IniciarAbonoDTO iniDto = new IniciarAbonoDTO(4L, 1L, 15000);
    IniciarAbonoResponseDTO iniRes = saldoService.iniciarAbono(iniDto);

    assertNotNull(iniRes);
    assertNotNull(iniRes.getToken());
    assertEquals(EstadoAbono.PENDIENTE, iniRes.getEstado());

    Abono abonoGuardado = new Abono(4L, 1L, 15000);
    abonoGuardado.setId(50L);
    abonoGuardado.setTokenTransaccion(iniRes.getToken());

    when(abonoRepository.findByTokenTransaccionAndIdEstablecimiento(iniRes.getToken(), 1L))
        .thenReturn(Optional.of(abonoGuardado));

    ConfirmarAbonoDTO confDto = new ConfirmarAbonoDTO(iniRes.getToken());
    ConfirmarAbonoResponseDTO confRes = saldoService.confirmarAbono(confDto);

    assertNotNull(confRes);
    assertEquals(EstadoAbono.APROBADO, confRes.getEstado());
    assertEquals(25000, cuentaPrueba.getSaldoActual());
    assertEquals(25000, cuentaPrueba.getSaldoDisponible());
    assertFalse(cuentaPrueba.estaBloqueada());
  }

  @Test
  @DisplayName(
      "6. Control de referencia única previene doble retención o abono ante reintentos de red")
  void testIdempotenciaEvitaDuplicidad() {
    MovimientoSaldo movPrevio =
        new MovimientoSaldo(
            cuentaPrueba,
            TipoMovimientoSaldo.RESERVA,
            5000,
            10000,
            101L,
            "Retención previa",
            "KEY-IDEM-01");
    movPrevio.setId(88L);

    when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-IDEM-01")).thenReturn(true);
    when(movimientoSaldoRepository.findByReferenciaUnica("KEY-IDEM-01"))
        .thenReturn(Optional.of(movPrevio));

    RetenerSaldoDTO dto = new RetenerSaldoDTO(1L, 5000, 101L);
    dto.setReferenciaUnica("KEY-IDEM-01");

    MovimientoSaldoDTO res = saldoService.retenerSaldo(dto);

    assertNotNull(res);
    assertEquals(88L, res.getId());
    assertEquals(5000, res.getMonto());
    verify(cuentaSaldoRepository, never()).save(any());
  }

  @Test
  @DisplayName("7. Liquidación por retiro: egresa saldo a 0 y emite movimiento DEVOLUCION_SALDO")
  void testLiquidarSaldoPorRetiro() {
    var cliente = mock(cl.edusaldo.alumnos.client.UsuariosSaldosClient.class);
    var constancias = mock(cl.edusaldo.alumnos.repository.ConstanciaDevolucionSaldoRepository.class);
    org.springframework.test.util.ReflectionTestUtils.setField(saldoService, "usuariosSaldosClient", cliente);
    org.springframework.test.util.ReflectionTestUtils.setField(saldoService, "constanciaDevolucionSaldoRepository", constancias);
    when(cuentaSaldoRepository.buscarParaReintegro(1L, 1L))
        .thenReturn(Optional.of(cuentaPrueba));
    when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
    when(movimientoSaldoRepository.save(any(MovimientoSaldo.class)))
        .thenAnswer(
            i -> {
              MovimientoSaldo m = i.getArgument(0);
              m.setId(99L);
              return m;
            });

    LiquidarSaldoDTO dto =
        new LiquidarSaldoDTO(1L, 4L, "TRANSFERENCIA", "TR-777", "Retiro definitivo");
    LiquidarSaldoResponseDTO res = saldoService.liquidarSaldoPorRetiro(dto);

    assertNotNull(res);
    assertEquals(10000, res.getMontoLiquidado());
    assertEquals(0, res.getSaldoActual());
    assertEquals(0, cuentaPrueba.getSaldoActual());
  }
  @Test void liquidacionRechazaCuentaSinSaldo() {
    var cuenta = new CuentaSaldo(1L, 0, 0);
    assertThrows(IllegalStateException.class, () -> cuenta.liquidarSaldoPorRetiro(4L, "EFECTIVO", "COMP-1", "Retiro"));
  }
  @Test void liquidacionRechazaApoderadoNoVinculadoSinMovimiento() {
    var cliente = mock(cl.edusaldo.alumnos.client.UsuariosSaldosClient.class);
    org.springframework.test.util.ReflectionTestUtils.setField(saldoService, "usuariosSaldosClient", cliente);
    doThrow(new SecurityException("Sin vínculo")).when(cliente).validarAlumnoYVinculo(1L, 4L);
    var dto = new LiquidarSaldoDTO(1L, 4L, "EFECTIVO", "COMP-2", "Retiro");
    assertThrows(SecurityException.class, () -> saldoService.liquidarSaldoPorRetiro(dto));
    assertEquals(10000, cuentaPrueba.getSaldoActual());
    verify(movimientoSaldoRepository, never()).save(any());
  }

}
