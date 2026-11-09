package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.repository.*;
import cl.edusaldo.productos.service.InventarioService;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;

class CompromisoInventarioRegressionTest {
  @org.junit.jupiter.api.AfterEach
  void limpiarContexto() {
    cl.edusaldo.productos.config.RequestContext.clear();
  }

  @AfterEach
  void clear() {
    RequestContext.clear();
  }

  @Test
  void noConsumeUnaReservaDiferenteAunqueElProductoTengaStockRetenido() {
    RequestContext.set(new RequestContext(1L, 2L, "ENCARGADO", "ventas", 3000));
    var productos = mock(ProductoRepository.class);
    var movimientos = mock(MovimientoInventarioRepository.class);
    var reservas = mock(ReservaStockRepository.class);
    var servicio =
        new InventarioService(
            productos,
            movimientos,
            mock(SolicitudAjusteStockRepository.class),
            mock(IngresoStockRepository.class));
    ReflectionTestUtils.setField(servicio, "reservaStockRepository", reservas);
    var p = new Producto(new Categoria("Textos", ""), "TXT", "Libro", "", "", "1", 100, 10, 2);
    p.setId(1L);
    p.retenerStockPorReserva(3, 10L, 2L);
    when(productos.findByIdAndIdEstablecimiento(1L, 1L)).thenReturn(Optional.of(p));
    var dto = new DescontarStockDTO(1L, 3, 20L, true, 2L);
    dto.setReservaId(99L);
    assertThrows(IllegalStateException.class, () -> servicio.descontarStock(dto));
    assertEquals(10, p.getStockFisico());
    assertEquals(3, p.getStockReservado());
  }
}
