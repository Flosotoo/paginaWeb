package cl.edusaldo.alumnos;

import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.AbonoRepository;
import cl.edusaldo.alumnos.repository.CuentaSaldoRepository;
import cl.edusaldo.alumnos.repository.MovimientoSaldoRepository;
import cl.edusaldo.alumnos.service.SaldoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MS Saldos · Pruebas Unitarias de SaldoService")
class SaldoServiceTest {

    @Mock
    private CuentaSaldoRepository cuentaSaldoRepository;

    @Mock
    private MovimientoSaldoRepository movimientoSaldoRepository;

    @Mock
    private AbonoRepository abonoRepository;

    @InjectMocks
    private SaldoService saldoService;

    private CuentaSaldo cuentaPrueba;

    @BeforeEach
    void setUp() {
        cuentaPrueba = new CuentaSaldo(1L, 10000, 0);
        cuentaPrueba.setId(10L);
    }

    @Test
    @DisplayName("1. Rechazo de retención si el saldo disponible es insuficiente")
    void testRechazoCompromisoSaldoInsuficiente() {
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-01")).thenReturn(false);

        RetenerSaldoDTO dto = new RetenerSaldoDTO(1L, 15000, 101L);
        dto.setReferenciaUnica("KEY-01");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> saldoService.retenerSaldo(dto));
        assertTrue(ex.getMessage().contains("Saldo insuficiente"));
        assertEquals(10000, cuentaPrueba.getSaldoActual());
        assertEquals(0, cuentaPrueba.getSaldoComprometido());
        assertEquals(10000, cuentaPrueba.getSaldoDisponible());
    }

    @Test
    @DisplayName("2. Retención de saldo incrementa saldo comprometido y reduce disponible")
    void testRetencionSaldoIncrementaComprometidoYReduceDisponible() {
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-02")).thenReturn(false);
        when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any(MovimientoSaldo.class))).thenAnswer(i -> {
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

        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-03")).thenReturn(false);
        when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any(MovimientoSaldo.class))).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(2L);
            return m;
        });

        CobrarSaldoDTO dto = new CobrarSaldoDTO(1L, 4000, 501L, true);
        dto.setReferenciaUnica("KEY-03");

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
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any(MovimientoSaldo.class))).thenAnswer(i -> {
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
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(abonoRepository.save(any(Abono.class))).thenAnswer(i -> {
            Abono a = i.getArgument(0);
            a.setId(50L);
            return a;
        });
        when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any(MovimientoSaldo.class))).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(10L);
            return m;
        });

        // 1. Iniciar abono
        IniciarAbonoDTO iniDto = new IniciarAbonoDTO(4L, 1L, 15000);
        IniciarAbonoResponseDTO iniRes = saldoService.iniciarAbono(iniDto);

        assertNotNull(iniRes);
        assertNotNull(iniRes.getToken());
        assertEquals(EstadoAbono.PENDIENTE, iniRes.getEstado());

        Abono abonoGuardado = new Abono(4L, 1L, 15000);
        abonoGuardado.setId(50L);
        abonoGuardado.setTokenTransaccion(iniRes.getToken());

        when(abonoRepository.findByTokenTransaccion(iniRes.getToken())).thenReturn(Optional.of(abonoGuardado));

        // 2. Confirmar abono
        ConfirmarAbonoDTO confDto = new ConfirmarAbonoDTO(iniRes.getToken());
        ConfirmarAbonoResponseDTO confRes = saldoService.confirmarAbono(confDto);

        assertNotNull(confRes);
        assertEquals(EstadoAbono.APROBADO, confRes.getEstado());
        assertEquals(25000, cuentaPrueba.getSaldoActual());
        assertEquals(25000, cuentaPrueba.getSaldoDisponible());
        assertFalse(cuentaPrueba.estaBloqueada());
    }

    @Test
    @DisplayName("6. Control de referencia única previene doble retención o abono ante reintentos de red")
    void testIdempotenciaEvitaDuplicidad() {
        MovimientoSaldo movPrevio = new MovimientoSaldo(
                cuentaPrueba, TipoMovimientoSaldo.RESERVA, 5000, 10000,
                101L, "Retención previa", "KEY-IDEM-01"
        );
        movPrevio.setId(88L);

        when(movimientoSaldoRepository.existsByReferenciaUnica("KEY-IDEM-01")).thenReturn(true);
        when(movimientoSaldoRepository.findByReferenciaUnica("KEY-IDEM-01")).thenReturn(Optional.of(movPrevio));

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
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuentaPrueba));
        when(cuentaSaldoRepository.save(any(CuentaSaldo.class))).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any(MovimientoSaldo.class))).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(99L);
            return m;
        });

        LiquidarSaldoDTO dto = new LiquidarSaldoDTO(1L, 4L, "TRANSFERENCIA", "TR-777", "Retiro definitivo");
        LiquidarSaldoResponseDTO res = saldoService.liquidarSaldoPorRetiro(dto);

        assertNotNull(res);
        assertEquals(10000, res.getMontoLiquidado());
        assertEquals(0, res.getSaldoActual());
        assertEquals(0, cuentaPrueba.getSaldoActual());
    }
}
