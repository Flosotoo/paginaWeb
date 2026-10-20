package cl.edusaldo.alumnos;

import cl.edusaldo.alumnos.controller.SaldoController;
import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.exception.GlobalExceptionHandler;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.AbonoRepository;
import cl.edusaldo.alumnos.repository.CuentaSaldoRepository;
import cl.edusaldo.alumnos.repository.MovimientoSaldoRepository;
import cl.edusaldo.alumnos.service.SaldoService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MS Saldos · Pruebas de Endpoints REST en SaldoController")
class SaldoControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private CuentaSaldoRepository cuentaSaldoRepository;

    @Mock
    private MovimientoSaldoRepository movimientoSaldoRepository;

    @Mock
    private AbonoRepository abonoRepository;

    private SaldoService saldoService;
    private SaldoController saldoController;

    @BeforeEach
    void setUp() {
        saldoService = new SaldoService(cuentaSaldoRepository, movimientoSaldoRepository, abonoRepository);
        saldoController = new SaldoController(saldoService);
        mockMvc = MockMvcBuilders.standaloneSetup(saldoController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/saldos/cuenta/{alumnoId} retorna 200 con saldoDisponible")
    void testConsultarCuenta() throws Exception {
        CuentaSaldo cuenta = new CuentaSaldo(1L, 10000, 2000);
        cuenta.setId(1L);

        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));

        mockMvc.perform(get("/api/saldos/cuenta/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alumnoId").value(1))
                .andExpect(jsonPath("$.saldoActual").value(10000))
                .andExpect(jsonPath("$.saldoComprometido").value(2000))
                .andExpect(jsonPath("$.saldoDisponible").value(8000));
    }

    @Test
    @DisplayName("POST /api/saldos/abonos/iniciar retorna 201 con token")
    void testIniciarAbono() throws Exception {
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(new CuentaSaldo(1L, 0, 0)));
        when(abonoRepository.save(any(Abono.class))).thenAnswer(i -> {
            Abono a = i.getArgument(0);
            a.setId(10L);
            return a;
        });

        IniciarAbonoDTO req = new IniciarAbonoDTO(4L, 1L, 15000);

        mockMvc.perform(post("/api/saldos/abonos/iniciar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.monto").value(15000));
    }

    @Test
    @DisplayName("POST /api/saldos/abonos/confirmar retorna 200 con estado APROBADO")
    void testConfirmarAbono() throws Exception {
        Abono abono = Abono.iniciar(4L, 1L, 15000);
        abono.setId(10L);
        CuentaSaldo cuenta = new CuentaSaldo(1L, 10000, 0);

        when(abonoRepository.findByTokenTransaccion(abono.getTokenTransaccion())).thenReturn(Optional.of(abono));
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));
        when(cuentaSaldoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(abonoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any())).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(5L);
            return m;
        });

        ConfirmarAbonoDTO req = new ConfirmarAbonoDTO(abono.getTokenTransaccion());

        mockMvc.perform(post("/api/saldos/abonos/confirmar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("APROBADO"))
                .andExpect(jsonPath("$.saldoActual").value(25000));
    }

    @Test
    @DisplayName("POST /api/saldos/retener retorna 422 ante saldo insuficiente")
    void testRetenerSaldoInsuficiente422() throws Exception {
        CuentaSaldo cuenta = new CuentaSaldo(1L, 1000, 0);
        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));

        RetenerSaldoDTO req = new RetenerSaldoDTO(1L, 9999999, 101L);

        mockMvc.perform(post("/api/saldos/retener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.error").value("Unprocessable Entity"));
    }

    @Test
    @DisplayName("POST /api/saldos/cobrar retorna 200 con alertaSaldoBajo")
    void testCobrarEntrega() throws Exception {
        CuentaSaldo cuenta = new CuentaSaldo(1L, 10000, 0);

        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));
        when(cuentaSaldoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any())).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(12L);
            return m;
        });

        CobrarSaldoDTO req = new CobrarSaldoDTO(1L, 7500, 501L, false);

        mockMvc.perform(post("/api/saldos/cobrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alertaSaldoBajo").value(true))
                .andExpect(jsonPath("$.saldoActual").value(2500));
    }

    @Test
    @DisplayName("POST /api/saldos/liquidar-retiro retorna 200 con montoLiquidado y saldo 0")
    void testLiquidarRetiro() throws Exception {
        CuentaSaldo cuenta = new CuentaSaldo(1L, 10000, 0);

        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));
        when(cuentaSaldoRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(movimientoSaldoRepository.save(any())).thenAnswer(i -> {
            MovimientoSaldo m = i.getArgument(0);
            m.setId(33L);
            return m;
        });

        LiquidarSaldoDTO req = new LiquidarSaldoDTO(1L, 4L, "TRANSFERENCIA", "TR-1234", "Retiro");

        mockMvc.perform(post("/api/saldos/liquidar-retiro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.montoLiquidado").value(10000))
                .andExpect(jsonPath("$.saldoActual").value(0));
    }

    @Test
    @DisplayName("GET /api/saldos/cuenta/{alumnoId}/movimientos retorna lista 200")
    void testListarMovimientos() throws Exception {
        CuentaSaldo cuenta = new CuentaSaldo(1L, 10000, 0);
        cuenta.setId(1L);

        when(cuentaSaldoRepository.findByAlumnoId(1L)).thenReturn(Optional.of(cuenta));

        MovimientoSaldo mov = new MovimientoSaldo(cuenta, TipoMovimientoSaldo.ABONO, 10000, 10000, 1L, "Abono");
        mov.setId(1L);

        when(movimientoSaldoRepository.findByCuentaSaldoIdOrderByFechaDesc(1L)).thenReturn(List.of(mov));

        mockMvc.perform(get("/api/saldos/cuenta/1/movimientos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tipo").value("ABONO"))
                .andExpect(jsonPath("$[0].monto").value(10000));
    }
}
