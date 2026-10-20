package cl.edusaldo.ventas;

import cl.edusaldo.ventas.dto.CrearDevolucionDTO;
import cl.edusaldo.ventas.dto.ItemDevolucionDTO;
import cl.edusaldo.ventas.model.DetalleEntrega;
import cl.edusaldo.ventas.model.Devolucion;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OrigenEntrega;
import cl.edusaldo.ventas.repository.DevolucionRepository;
import cl.edusaldo.ventas.repository.EntregaRepository;
import cl.edusaldo.ventas.service.DevolucionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevolucionTest {

    @Mock
    private EntregaRepository entregaRepository;

    @Mock
    private DevolucionRepository devolucionRepository;

    @InjectMocks
    private DevolucionService devolucionService;

    private Entrega entregaPrueba;
    private DetalleEntrega det1;

    @BeforeEach
    void setUp() {
        entregaPrueba = new Entrega("ENT-5001", null, 10L, OrigenEntrega.MESON, 4000, 2L);
        entregaPrueba.setId(50L);
        det1 = new DetalleEntrega(entregaPrueba, 101L, "Témpera 12 colores", 2, 2000);
        det1.setId(501L);
        entregaPrueba.getDetalles().add(det1);
    }

    @Test
    @DisplayName("1. HU37: Registro de devolución actualiza cantidadDevuelta y calcula total de reintegro")
    void testRegistroDevolucionExitosa() {
        when(entregaRepository.findById(50L)).thenReturn(Optional.of(entregaPrueba));
        when(devolucionRepository.save(any(Devolucion.class))).thenAnswer(i -> i.getArgument(0));

        CrearDevolucionDTO dto = new CrearDevolucionDTO();
        dto.setEntregaId(50L);
        dto.setEncargadoId(2L);
        dto.setMotivo("Producto con falla de empaque");

        ItemDevolucionDTO itemDev = new ItemDevolucionDTO();
        itemDev.setDetalleEntregaId(501L);
        itemDev.setCantidad(1);
        dto.setItems(List.of(itemDev));

        Devolucion dev = devolucionService.registrarDevolucion(dto);

        assertNotNull(dev);
        assertEquals(50L, dev.getEntregaId());
        assertEquals(10L, dev.getAlumnoId());
        assertEquals("Producto con falla de empaque", dev.getMotivo());
        assertEquals(2000, dev.getTotalReintegro());
        assertEquals(1, det1.getCantidadDevuelta());
        assertEquals(1, dev.getDetalles().size());
        assertTrue(dev.getCodigoDevolucion().startsWith("DEV-"));
    }

    @Test
    @DisplayName("2. HU37 Invariante: No se puede devolver más unidades de las entregadas")
    void testDevolucionExcedeCantidadEntregada() {
        when(entregaRepository.findById(50L)).thenReturn(Optional.of(entregaPrueba));

        CrearDevolucionDTO dto = new CrearDevolucionDTO();
        dto.setEntregaId(50L);
        dto.setEncargadoId(2L);
        dto.setMotivo("Exceso de compra");

        ItemDevolucionDTO itemDev = new ItemDevolucionDTO();
        itemDev.setDetalleEntregaId(501L);
        itemDev.setCantidad(3); // Solo se entregaron 2
        dto.setItems(List.of(itemDev));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                devolucionService.registrarDevolucion(dto)
        );
        assertTrue(ex.getMessage().contains("excede la cantidad disponible"));
    }
}
