package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.repository.*;
import cl.edusaldo.productos.service.InventarioService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InventarioServiceTest {
  @org.junit.jupiter.api.AfterEach
  void limpiarContexto() {
    cl.edusaldo.productos.config.RequestContext.clear();
  }

  @Mock private ProductoRepository productoRepository;

  @Mock private MovimientoInventarioRepository movimientoInventarioRepository;

  @Mock private SolicitudAjusteStockRepository solicitudAjusteStockRepository;

  @Mock private IngresoStockRepository ingresoStockRepository;

  @InjectMocks private InventarioService inventarioService;

  private Categoria categoriaPrueba;
  private Producto productoPrueba;

  @BeforeEach
  void setUp() {
    cl.edusaldo.productos.config.RequestContext.set(
        new cl.edusaldo.productos.config.RequestContext(1L, 2L, "ADMINISTRADOR", "ventas", 3000));
    categoriaPrueba = new Categoria("Cuadernos", "Cuadernos escolares");
    categoriaPrueba.setId(1L);

    productoPrueba =
        new Producto(
            categoriaPrueba,
            "CUAD-UNI-01",
            "Cuaderno universitario",
            "Cuaderno espiral 100 hojas",
            "http://img.jpg",
            "Todos",
            1250,
            10,
            5);
    productoPrueba.setId(1L);
  }

  @Test
  @DisplayName(
      "1. Ingreso manual de mercadería por Encargado actualiza stock físico y genera trazabilidad")
  void testIngresoManualMercaderia() {
    when(productoRepository.findByIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(productoPrueba));
    when(ingresoStockRepository.save(any(IngresoStock.class)))
        .thenAnswer(
            i -> {
              IngresoStock ing = i.getArgument(0);
              ing.setId(10L);
              return ing;
            });

    IngresoManualDTO dto = new IngresoManualDTO();
    dto.setEncargadoId(2L);
    dto.setProveedor("Distribuidora Escolar Central");
    dto.setDocumentoReferencia("GUIA-DESPACHO-4581");
    dto.setObservacion("Recepción de cuadernos para inicio de semestre");
    dto.setDetalles(List.of(new DetalleIngresoDTO(1L, 25)));

    IngresoStock resultado = inventarioService.registrarIngresoManual(dto);

    assertNotNull(resultado);
    assertEquals(35, productoPrueba.getStockFisico()); // 10 inicial + 25
    assertEquals(35, productoPrueba.getStockDisponible());
    verify(productoRepository).save(productoPrueba);
    verify(movimientoInventarioRepository).save(any(MovimientoInventario.class));
  }

  @Test
  @DisplayName(
      "2. Invariante de Reserva: Rechazo controlado cuando la solicitud supera el stock disponible")
  void testRechazoReservaStockInsuficiente() {
    cl.edusaldo.productos.config.RequestContext.set(
        new cl.edusaldo.productos.config.RequestContext(1L, 4L, "ALUMNO", "ventas", 3000));
    when(productoRepository.findByIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(productoPrueba));

    RetenerStockDTO dto = new RetenerStockDTO(1L, 15, 101L, 4L); // 15 > 10 disponible

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> inventarioService.retenerStock(dto));
    assertTrue(ex.getMessage().contains("Stock insuficiente"));
    assertEquals(10, productoPrueba.getStockFisico());
    assertEquals(0, productoPrueba.getStockReservado());
    assertEquals(10, productoPrueba.getStockDisponible());
    verify(movimientoInventarioRepository, never()).save(any());
  }

  @Test
  @DisplayName("3. Solicitud de ajuste de stock por Encargado queda en PENDIENTE sin alterar stock")
  void testSolicitudAjusteNoAlteraStock() {
    when(productoRepository.findByIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(productoPrueba));
    when(solicitudAjusteStockRepository.save(any(SolicitudAjusteStock.class)))
        .thenAnswer(
            i -> {
              SolicitudAjusteStock s = i.getArgument(0);
              s.setId(50L);
              return s;
            });

    SolicitarAjusteDTO dto = new SolicitarAjusteDTO(1L, -3, "Merma por daño de agua", 2L);
    SolicitudAjusteStock solicitud = inventarioService.solicitarAjuste(dto);

    assertNotNull(solicitud);
    assertEquals(EstadoSolicitud.PENDIENTE, solicitud.getEstado());
    assertEquals(-3, solicitud.getCantidad());
    assertEquals(2L, solicitud.getEncargadoId());

    assertEquals(10, productoPrueba.getStockFisico());
    assertEquals(10, productoPrueba.getStockDisponible());
  }

  @Test
  @DisplayName(
      "4. Aprobación exclusiva por Administrador impacta stock físico y genera MovimientoInventario"
          + " AJUSTE")
  void testAprobacionAjustePorAdmin() {
    cl.edusaldo.productos.config.RequestContext.set(
        new cl.edusaldo.productos.config.RequestContext(1L, 1L, "ADMINISTRADOR", "ventas", 3000));
    SolicitudAjusteStock solicitud =
        new SolicitudAjusteStock(productoPrueba, -2, "Merma autorizada", 2L);
    solicitud.setId(51L);

    when(solicitudAjusteStockRepository.buscarParaResolucion(51L, 1L))
        .thenReturn(Optional.of(solicitud));
    when(solicitudAjusteStockRepository.save(any(SolicitudAjusteStock.class)))
        .thenAnswer(i -> i.getArgument(0));

    AprobarAjusteDTO dto = new AprobarAjusteDTO(1L); // Administrador ID 1
    SolicitudAjusteStock resuelta = inventarioService.aprobarAjuste(51L, dto);

    assertEquals(EstadoSolicitud.APROBADA, resuelta.getEstado());
    assertEquals(1L, resuelta.getAdministradorId());
    assertNotNull(resuelta.getFechaResolucion());
    assertEquals(8, productoPrueba.getStockFisico()); // 10 - 2 = 8
    assertEquals(8, productoPrueba.getStockDisponible());
    verify(productoRepository).save(productoPrueba);
    verify(movimientoInventarioRepository).save(any(MovimientoInventario.class));
  }

  @Test
  @DisplayName("5. Rechazo exclusivo por Administrador con motivo no modifica el stock físico")
  void testRechazoAjustePorAdmin() {
    cl.edusaldo.productos.config.RequestContext.set(
        new cl.edusaldo.productos.config.RequestContext(1L, 1L, "ADMINISTRADOR", "ventas", 3000));
    SolicitudAjusteStock solicitud =
        new SolicitudAjusteStock(productoPrueba, -2, "Merma dudosa", 2L);
    solicitud.setId(52L);

    when(solicitudAjusteStockRepository.buscarParaResolucion(52L, 1L))
        .thenReturn(Optional.of(solicitud));
    when(solicitudAjusteStockRepository.save(any(SolicitudAjusteStock.class)))
        .thenAnswer(i -> i.getArgument(0));

    RechazarAjusteDTO dto =
        new RechazarAjusteDTO(1L, "Evidencia fotográfica no corresponde al lote");
    SolicitudAjusteStock resuelta = inventarioService.rechazarAjuste(52L, dto);

    assertEquals(EstadoSolicitud.RECHAZADA, resuelta.getEstado());
    assertEquals(1L, resuelta.getAdministradorId());
    assertEquals("Evidencia fotográfica no corresponde al lote", resuelta.getMotivoRechazo());
    assertEquals(10, productoPrueba.getStockFisico()); // Stock NO modificado
    verify(productoRepository, never()).save(any());
    verify(movimientoInventarioRepository, never()).save(any());
  }

  @Test
  @DisplayName("6. Ciclo de retención, liberación y descuento formal de stock")
  void testFlujoCompletoRetenerLiberarDescontar() {
    when(productoRepository.findByIdAndIdEstablecimiento(1L, 1L))
        .thenReturn(Optional.of(productoPrueba));

    RetenerStockDTO dtoRetener = new RetenerStockDTO(1L, 4, 201L, 2L);
    inventarioService.retenerStock(dtoRetener);
    assertEquals(10, productoPrueba.getStockFisico());
    assertEquals(4, productoPrueba.getStockReservado());
    assertEquals(6, productoPrueba.getStockDisponible());

    LiberarStockDTO dtoLiberar = new LiberarStockDTO(1L, 1, 201L, 2L);
    inventarioService.liberarStock(dtoLiberar);
    assertEquals(10, productoPrueba.getStockFisico());
    assertEquals(3, productoPrueba.getStockReservado());
    assertEquals(7, productoPrueba.getStockDisponible());

    DescontarStockDTO dtoDescontar = new DescontarStockDTO(1L, 3, 301L, true, 2L);
    dtoDescontar.setReservaId(201L);
    inventarioService.descontarStock(dtoDescontar);
    assertEquals(7, productoPrueba.getStockFisico());
    assertEquals(0, productoPrueba.getStockReservado());
    assertEquals(7, productoPrueba.getStockDisponible());
  }
}
