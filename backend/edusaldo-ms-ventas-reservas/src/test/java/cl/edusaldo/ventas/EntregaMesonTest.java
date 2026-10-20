package cl.edusaldo.ventas;

import cl.edusaldo.ventas.dto.EntregaMesonDTO;
import cl.edusaldo.ventas.dto.ItemEntregaDTO;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OrigenEntrega;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.service.EntregaService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EntregaMesonTest {

    @Mock
    private EntregaRepository entregaRepository;

    @InjectMocks
    private EntregaService entregaService;

    @Test
    @DisplayName("1. HU34: Registro de entrega directa en mesón asigna origen MESON y calcula total")
    void testEntregaDirectaMesonCalculaTotal() {
        EntregaMesonDTO dto = new EntregaMesonDTO();
        dto.setAlumnoId(8L);
        dto.setEncargadoId(2L);

        ItemEntregaDTO item1 = new ItemEntregaDTO();
        item1.setProductoId(20L);
        item1.setNombreProducto("Lápiz mina HB");
        item1.setCantidad(4);
        item1.setPrecioUnitario(300);

        ItemEntregaDTO item2 = new ItemEntregaDTO();
        item2.setProductoId(21L);
        item2.setNombreProducto("Destacador fluorescente");
        item2.setCantidad(2);
        item2.setPrecioUnitario(750);

        dto.setItems(List.of(item1, item2));

        when(entregaRepository.save(any(Entrega.class))).thenAnswer(i -> i.getArgument(0));

        Entrega entrega = entregaService.registrarEntregaMeson(dto);

        assertNotNull(entrega);
        assertEquals(OrigenEntrega.MESON, entrega.getOrigen());
        assertNull(entrega.getReservaId());
        assertEquals(8L, entrega.getAlumnoId());
        assertEquals(2L, entrega.getEncargadoId());
        // 4 * 300 = 1200 + 2 * 750 = 1500 => 2700
        assertEquals(2700, entrega.getTotal());
        assertEquals(2, entrega.getDetalles().size());
        assertTrue(entrega.getNumero().startsWith("ENT-"));
    }

    @Test
    @DisplayName("2. HU36: Historial de entregas y consulta de entregas del día")
    void testHistorialYEntregasDelDia() {
        Entrega e1 = new Entrega("ENT-1", null, 1L, OrigenEntrega.MESON, 1500, 2L);
        Entrega e2 = new Entrega("ENT-2", 101L, 2L, OrigenEntrega.RESERVA, 3000, 2L);

        when(entregaRepository.findAllByOrderByFechaDesc()).thenReturn(List.of(e1, e2));
        when(entregaRepository.findByFechaBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(e1, e2));

        List<Entrega> historial = entregaService.listarHistorial();
        assertEquals(2, historial.size());

        List<Entrega> delDia = entregaService.listarDelDia();
        assertEquals(2, delDia.size());
    }

    @Test
    @DisplayName("3. Invariante: Entrega en mesón rechaza lista vacía de items")
    void testEntregaMesonRechazaItemsVacios() {
        EntregaMesonDTO dto = new EntregaMesonDTO();
        dto.setAlumnoId(8L);
        dto.setEncargadoId(2L);
        dto.setItems(List.of());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                entregaService.registrarEntregaMeson(dto)
        );
        assertTrue(ex.getMessage().contains("al menos un material"));
    }
}
