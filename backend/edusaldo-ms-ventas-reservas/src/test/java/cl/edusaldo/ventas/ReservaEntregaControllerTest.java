package cl.edusaldo.ventas;

import cl.edusaldo.ventas.controller.DevolucionController;
import cl.edusaldo.ventas.controller.EntregaController;
import cl.edusaldo.ventas.controller.ReservaController;
import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.exception.GlobalExceptionHandler;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.repository.DevolucionRepository;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.repository.ReservaRepository;
import cl.edusaldo.ventas.service.DevolucionService;
import cl.edusaldo.ventas.service.EntregaService;
import cl.edusaldo.ventas.service.ReservaService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReservaEntregaControllerTest {

    private MockMvc mockMvcReserva;
    private MockMvc mockMvcEntrega;
    private MockMvc mockMvcDevolucion;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private DevolucionRepository devolucionRepository;

    private ReservaService reservaService;
    private EntregaService entregaService;
    private DevolucionService devolucionService;

    @BeforeEach
    void setUp() {
        reservaService = new ReservaService(reservaRepository, entregaRepository);
        entregaService = new EntregaService(entregaRepository);
        devolucionService = new DevolucionService(devolucionRepository, entregaRepository);

        ReservaController reservaController = new ReservaController(reservaService);
        EntregaController entregaController = new EntregaController(entregaService);
        DevolucionController devolucionController = new DevolucionController(devolucionService);

        mockMvcReserva = MockMvcBuilders.standaloneSetup(reservaController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        mockMvcEntrega = MockMvcBuilders.standaloneSetup(entregaController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
        mockMvcDevolucion = MockMvcBuilders.standaloneSetup(devolucionController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("1. POST /api/reservas -> 201 Created")
    void testCrearReservaEndpoint() throws Exception {
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> {
            Reserva r = i.getArgument(0);
            r.setId(10L);
            return r;
        });

        CrearReservaDTO dto = new CrearReservaDTO();
        dto.setAlumnoId(1L);
        dto.setCreadaPorId(2L);
        ItemReservaDTO item = new ItemReservaDTO();
        item.setProductoId(100L);
        item.setNombreProducto("Cuaderno");
        item.setCantidad(2);
        item.setPrecioUnitario(1000);
        dto.setItems(List.of(item));

        mockMvcReserva.perform(post("/api/reservas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.total").value(2000))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"));
    }

    @Test
    @DisplayName("2. POST /api/reservas/{id}/marcar-lista (HU31 CA2) -> 200 OK")
    void testMarcarListaEndpoint() throws Exception {
        Reserva r = new Reserva("RES-1234", 1L, 2L, 2000);
        r.setId(10L);
        when(reservaRepository.findById(10L)).thenReturn(Optional.of(r));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));

        mockMvcReserva.perform(post("/api/reservas/10/marcar-lista")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"encargadoId\": 3}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("LISTA_PARA_RETIRO"))
                .andExpect(jsonPath("$.preparadaPorId").value(3))
                .andExpect(jsonPath("$.fechaPreparacion").isNotEmpty());
    }

    @Test
    @DisplayName("3. POST /api/reservas/{id}/cancelar -> 200 OK")
    void testCancelarReservaEndpoint() throws Exception {
        Reserva r = new Reserva("RES-1234", 1L, 2L, 2000);
        r.setId(10L);
        when(reservaRepository.findById(10L)).thenReturn(Optional.of(r));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));

        mockMvcReserva.perform(post("/api/reservas/10/cancelar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\": \"Desistimiento\", \"usuarioId\": 1, \"rol\": \"ALU\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("CANCELADA"))
                .andExpect(jsonPath("$.motivoCancelacion").value("Desistimiento"))
                .andExpect(jsonPath("$.canceladaPorId").value(1));
    }

    @Test
    @DisplayName("4. POST /api/reservas/{id}/entregar -> 201 Created con origen RESERVA")
    void testEntregarReservaEndpoint() throws Exception {
        Reserva r = new Reserva("RES-1234", 1L, 2L, 2000);
        r.setId(10L);
        r.marcarListaParaRetiro(3L);
        r.agregarDetalle(100L, "Cuaderno", 2, 1000);

        when(reservaRepository.findById(10L)).thenReturn(Optional.of(r));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(i -> {
            Entrega e = i.getArgument(0);
            e.setId(50L);
            return e;
        });

        mockMvcReserva.perform(post("/api/reservas/10/entregar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"encargadoId\": 3}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.origen").value("RESERVA"))
                .andExpect(jsonPath("$.total").value(2000));
    }

    @Test
    @DisplayName("5. POST /api/entregas/meson -> 201 Created con origen MESON")
    void testEntregaMesonEndpoint() throws Exception {
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(i -> {
            Entrega e = i.getArgument(0);
            e.setId(51L);
            return e;
        });

        EntregaMesonDTO dto = new EntregaMesonDTO();
        dto.setAlumnoId(1L);
        dto.setEncargadoId(3L);
        ItemEntregaDTO item = new ItemEntregaDTO();
        item.setProductoId(200L);
        item.setNombreProducto("Lápiz");
        item.setCantidad(3);
        item.setPrecioUnitario(500);
        dto.setItems(List.of(item));

        mockMvcEntrega.perform(post("/api/entregas/meson")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(51))
                .andExpect(jsonPath("$.origen").value("MESON"))
                .andExpect(jsonPath("$.total").value(1500));
    }

    @Test
    @DisplayName("6. GET /api/entregas/historial -> 200 OK")
    void testHistorialEntregasEndpoint() throws Exception {
        Entrega e = new Entrega("ENT-1", null, 1L, OrigenEntrega.MESON, 1500, 3L);
        when(entregaRepository.findAllByOrderByFechaDesc()).thenReturn(List.of(e));

        mockMvcEntrega.perform(get("/api/entregas/historial"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].numero").value("ENT-1"));
    }

    @Test
    @DisplayName("7. POST /api/devoluciones -> 201 Created con totalReintegro")
    void testRegistrarDevolucionEndpoint() throws Exception {
        Entrega e = new Entrega("ENT-500", null, 1L, OrigenEntrega.MESON, 2000, 3L);
        e.setId(51L);
        DetalleEntrega det = new DetalleEntrega(e, 200L, "Lápiz", 4, 500);
        det.setId(501L);
        e.getDetalles().add(det);

        when(entregaRepository.findById(51L)).thenReturn(Optional.of(e));
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(i -> i.getArgument(0));
        when(devolucionRepository.save(any(Devolucion.class))).thenAnswer(i -> {
            Devolucion d = i.getArgument(0);
            d.setId(90L);
            return d;
        });

        CrearDevolucionDTO dto = new CrearDevolucionDTO();
        dto.setEntregaId(51L);
        dto.setEncargadoId(3L);
        dto.setMotivo("Defectuoso");
        ItemDevolucionDTO item = new ItemDevolucionDTO();
        item.setDetalleEntregaId(501L);
        item.setCantidad(2);
        dto.setItems(List.of(item));

        mockMvcDevolucion.perform(post("/api/devoluciones")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(90))
                .andExpect(jsonPath("$.totalReintegro").value(1000));
    }
}
