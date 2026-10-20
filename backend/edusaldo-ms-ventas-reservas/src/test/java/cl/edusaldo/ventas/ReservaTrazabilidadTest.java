package cl.edusaldo.ventas;

import cl.edusaldo.ventas.dto.CrearReservaDTO;
import cl.edusaldo.ventas.dto.ItemReservaDTO;
import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.OrigenEntrega;
import cl.edusaldo.ventas.model.Reserva;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.repository.ReservaRepository;
import cl.edusaldo.ventas.service.ReservaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReservaTrazabilidadTest {

    @Mock
    private ReservaRepository reservaRepository;

    @Mock
    private EntregaRepository entregaRepository;

    @InjectMocks
    private ReservaService reservaService;

    private Reserva reservaPrueba;

    @BeforeEach
    void setUp() {
        reservaPrueba = new Reserva("RES-1001", 1L, 4L, 2500);
        reservaPrueba.setId(101L);
        reservaPrueba.agregarDetalle(101L, "Cuaderno universitario", 2, 1250);
    }

    @Test
    @DisplayName("1. HU31 CA2: Marcar lista para retiro registra obligatoriamente preparadaPorId y fechaPreparacion")
    void testMarcarListaParaRetiroRegistraTrazabilidadHU31CA2() {
        when(reservaRepository.findById(101L)).thenReturn(Optional.of(reservaPrueba));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));

        assertEquals(EstadoReserva.PENDIENTE, reservaPrueba.getEstado());
        assertNull(reservaPrueba.getPreparadaPorId());
        assertNull(reservaPrueba.getFechaPreparacion());

        Reserva actualizada = reservaService.marcarListaParaRetiro(101L, 2L);

        assertEquals(EstadoReserva.LISTA_PARA_RETIRO, actualizada.getEstado());
        assertEquals(2L, actualizada.getPreparadaPorId());
        assertNotNull(actualizada.getFechaPreparacion());
        assertTrue(actualizada.getFechaPreparacion().isBefore(LocalDateTime.now().plusSeconds(2)));
    }

    @Test
    @DisplayName("2. HU31 CA2: No se puede marcar lista una reserva que no esté en estado PENDIENTE")
    void testMarcarListaInvalidaEstadoNoPendiente() {
        reservaPrueba.marcarListaParaRetiro(2L);
        when(reservaRepository.findById(101L)).thenReturn(Optional.of(reservaPrueba));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reservaService.marcarListaParaRetiro(101L, 3L)
        );
        assertTrue(ex.getMessage().contains("no está en estado PENDIENTE"));
    }

    @Test
    @DisplayName("3. HU33: Retiro de reserva genera Entrega formal con origen RESERVA y total en CLP")
    void testConfirmarRetiroGeneraEntregaFormal() {
        reservaPrueba.marcarListaParaRetiro(2L);
        when(reservaRepository.findById(101L)).thenReturn(Optional.of(reservaPrueba));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));
        when(entregaRepository.save(any(Entrega.class))).thenAnswer(i -> i.getArgument(0));

        Entrega entrega = reservaService.entregarReserva(101L, 2L);

        assertNotNull(entrega);
        assertEquals(OrigenEntrega.RESERVA, entrega.getOrigen());
        assertEquals(2500, entrega.getTotal());
        assertEquals(101L, entrega.getReservaId());
        assertEquals(1L, entrega.getAlumnoId());
        assertEquals(2L, entrega.getEncargadoId());
        assertEquals(1, entrega.getDetalles().size());
        assertEquals(EstadoReserva.ENTREGADA, reservaPrueba.getEstado());
    }

    @Test
    @DisplayName("4. HU35 y HU48: Cancelación de reserva por Encargado, Apoderado o Alumno (>= 12 años)")
    void testCancelacionReservaMultiRol() {
        when(reservaRepository.findById(101L)).thenReturn(Optional.of(reservaPrueba));
        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));

        Reserva cancelada = reservaService.cancelarReserva(101L, "Alumno desiste", 1L, "ALU");

        assertEquals(EstadoReserva.CANCELADA, cancelada.getEstado());
        assertEquals("Alumno desiste", cancelada.getMotivoCancelacion());
        assertEquals(1L, cancelada.getCanceladaPorId());

        // Intentar retirar o entregar una reserva cancelada debe arrojar excepción
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reservaService.entregarReserva(101L, 2L)
        );
        assertTrue(ex.getMessage().contains("no está lista"));
    }

    @Test
    @DisplayName("5. Invariante: Una reserva ya entregada no puede ser cancelada")
    void testReservaEntregadaNoPuedeCancelarse() {
        reservaPrueba.marcarListaParaRetiro(2L);
        reservaPrueba.confirmarRetiroYGenerarEntrega(2L);
        assertEquals(EstadoReserva.ENTREGADA, reservaPrueba.getEstado());

        when(reservaRepository.findById(101L)).thenReturn(Optional.of(reservaPrueba));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                reservaService.cancelarReserva(101L, "Intento tardío", 2L, "ENC")
        );
        assertTrue(ex.getMessage().contains("No se puede cancelar una reserva ya entregada"));
    }

    @Test
    @DisplayName("6. HU28 y HU47: Creación de reserva calcula subtotales y total exactos en CLP")
    void testCreacionReservaCalculaTotalExacto() {
        CrearReservaDTO dto = new CrearReservaDTO();
        dto.setAlumnoId(5L);
        dto.setCreadaPorId(12L);
        ItemReservaDTO item1 = new ItemReservaDTO();
        item1.setProductoId(10L);
        item1.setNombreProducto("Carpeta");
        item1.setCantidad(3);
        item1.setPrecioUnitario(1000);

        ItemReservaDTO item2 = new ItemReservaDTO();
        item2.setProductoId(11L);
        item2.setNombreProducto("Goma");
        item2.setCantidad(2);
        item2.setPrecioUnitario(350);

        dto.setItems(List.of(item1, item2));

        when(reservaRepository.save(any(Reserva.class))).thenAnswer(i -> i.getArgument(0));

        Reserva creada = reservaService.crearReserva(dto);

        assertNotNull(creada);
        assertEquals(5L, creada.getAlumnoId());
        assertEquals(12L, creada.getCreadaPorId());
        assertEquals(3700, creada.getTotal());
        assertEquals(EstadoReserva.PENDIENTE, creada.getEstado());
        assertEquals(2, creada.getDetalles().size());
    }
}
