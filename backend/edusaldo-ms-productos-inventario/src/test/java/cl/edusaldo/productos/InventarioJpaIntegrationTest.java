package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.repository.*;
import cl.edusaldo.productos.service.*;
import java.util.List;
import java.util.concurrent.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:inventario-regression;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never"
    })
class InventarioJpaIntegrationTest {
  @Autowired ObjectMapper mapper;
  @Autowired Validator validator;
  @Autowired InventarioService servicio;
  @Autowired ProductoService catalogo;
  @Autowired CategoriaRepository categorias;
  @Autowired ProductoRepository productos;
  @Autowired ReservaStockRepository reservas;
  @Autowired MovimientoInventarioRepository movimientos;
  @Autowired IngresoStockRepository ingresos;
  @Autowired SolicitudAjusteStockRepository solicitudes;
  @Autowired PlatformTransactionManager transactions;
  Producto primero, segundo;

  @BeforeEach
  void iniciar() {
    RequestContext.set(new RequestContext(1L, 2L, "ADMINISTRADOR", "ventas", 200));
    var c = categorias.saveAndFlush(new Categoria("Categoria " + System.nanoTime(), ""));
    primero =
        productos.saveAndFlush(
            new Producto(c, "SKU" + System.nanoTime(), "Libro", "", "", "1", 100, 10, 2));
    segundo =
        productos.saveAndFlush(
            new Producto(c, "SKU" + System.nanoTime(), "Cuaderno", "", "", "1", 100, 10, 2));
  }

  @AfterEach
  void limpiar() {
    RequestContext.clear();
  }

  @Test
  void entregaDeDosProductosConsumeCadaDetalleSinConfundirEntregaConReserva() {
    long reserva = System.nanoTime();
    servicio.retenerStock(new RetenerStockDTO(primero.getId(), 3, reserva, 2L));
    servicio.retenerStock(new RetenerStockDTO(segundo.getId(), 2, reserva, 2L));
    var d = new DescontarStockDTO(primero.getId(), 3, 500L, true, 2L);
    d.setReservaId(reserva);
    servicio.descontarStock(d);
    var e = new DescontarStockDTO(segundo.getId(), 2, 500L, true, 2L);
    e.setReservaId(reserva);
    servicio.descontarStock(e);
    assertEquals(0, productos.findById(primero.getId()).orElseThrow().getStockReservado());
    assertEquals(7, productos.findById(primero.getId()).orElseThrow().getStockFisico());
    new TransactionTemplate(transactions)
        .executeWithoutResult(
            status -> {
              var r = reservas.findByReservaIdAndIdEstablecimiento(reserva, 1L).orElseThrow();
              assertEquals("CONSUMIDA", r.getEstado());
              assertTrue(r.getDetalles().stream().allMatch(x -> "CONSUMIDO".equals(x.getEstado())));
            });
    var mov =
        movimientos.findByProductoIdOrderByFechaDesc(primero.getId()).stream()
            .filter(m -> m.getTipo() == TipoMovimientoInventario.ENTREGA)
            .findFirst()
            .orElseThrow();
    assertEquals(-3, mov.getVariacionReservada());
  }

  @Test
  void ingresoFallaConSegundoProductoYReviertePrimerStockYCabecera() {
    int antes = ingresos.findAll().size();
    var dto = new IngresoManualDTO();
    dto.setEncargadoId(2L);
    dto.setDetalles(
        List.of(
            new DetalleIngresoDTO(primero.getId(), 4), new DetalleIngresoDTO(Long.MAX_VALUE, 2)));
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarIngresoManual(dto));
    assertEquals(10, productos.findById(primero.getId()).orElseThrow().getStockFisico());
    assertEquals(antes, ingresos.findAll().size());
    assertTrue(movimientos.findByProductoIdOrderByFechaDesc(primero.getId()).isEmpty());
  }

  @Test
  void conteoNoMutaStockYQuedaEnTenantConProductosDelMismoColegio() {
    var dto = new ConteoFisicoDTO();
    dto.setEncargadoId(2L);
    dto.setIdEstablecimiento(2L);
    dto.setDetalles(List.of(new DetalleConteoDTO(primero.getId(), 7)));
    var conteo = servicio.registrarConteoFisico(dto);
    assertEquals(1L, conteo.getIdEstablecimiento());
    assertEquals(10, productos.findById(primero.getId()).orElseThrow().getStockFisico());
    RequestContext.set(new RequestContext(2L, 2L, "ADMINISTRADOR", "gateway", 200));
    assertThrows(IllegalArgumentException.class, () -> catalogo.obtenerPorId(primero.getId()));
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarConteoFisico(dto));
  }

  @Test
  void encargadoNoPuedeEditarProductosNiResolverAjustes() {
    RequestContext.set(new RequestContext(1L, 2L, "ENCARGADO", "gateway", 200));
    assertThrows(SecurityException.class, () -> catalogo.inactivarProducto(primero.getId()));
    assertThrows(
        SecurityException.class, () -> servicio.aprobarAjuste(1L, new AprobarAjusteDTO(2L)));
    assertEquals(
        EstadoRegistro.ACTIVO, productos.findById(primero.getId()).orElseThrow().getEstado());
  }

  @Test
  void reingresoNoSuperaUnidadesDescontadasEnLaEntrega() {
    servicio.descontarStock(new DescontarStockDTO(primero.getId(), 3, 909L, false, 2L));
    var a = new ReingresarStockDTO();
    a.setProductoId(primero.getId());
    a.setCantidad(2);
    a.setEntregaId(909L);
    a.setDevolucionId(910L);
    a.setUsuarioId(2L);
    servicio.reingresarStockPorDevolucion(a);
    var b = new ReingresarStockDTO();
    b.setProductoId(primero.getId());
    b.setCantidad(2);
    b.setEntregaId(909L);
    b.setDevolucionId(911L);
    b.setUsuarioId(2L);
    assertThrows(IllegalStateException.class, () -> servicio.reingresarStockPorDevolucion(b));
    assertEquals(9, productos.findById(primero.getId()).orElseThrow().getStockFisico());
  }
  private ReingresarStockDTO compensacion(long entrega, long operacion, int cantidad) throws Exception {
    return mapper.readValue("{\"productoId\":" + primero.getId()
        + ",\"cantidad\":" + cantidad + ",\"entregaId\":" + entrega
        + ",\"usuarioId\":2,\"operacionCompensacionId\":" + operacion
        + ",\"referenciaUnica\":\"COMPENSACION-" + operacion + "-" + primero.getId() + "\"}",
        ReingresarStockDTO.class);
  }

  @Test
  void compensacionRepiteSinDuplicarYRechazaCambiarEntrega() throws Exception {
    servicio.descontarStock(new DescontarStockDTO(primero.getId(), 3, 919L, false, 2L));
    var dto = compensacion(919L, 77L, 2);
    assertTrue(validator.validate(dto).isEmpty());
    servicio.reingresarStockPorDevolucion(dto);
    servicio.reingresarStockPorDevolucion(dto);
    assertThrows(IllegalStateException.class,
        () -> servicio.reingresarStockPorDevolucion(compensacion(920L, 77L, 2)));
    assertEquals(9, productos.findById(primero.getId()).orElseThrow().getStockFisico());
    assertEquals(1, movimientos.findByProductoIdOrderByFechaDesc(primero.getId()).stream()
        .filter(m -> m.getTipo() == TipoMovimientoInventario.COMPENSACION).count());
  }

  @Test
  void exigeExactamenteUnOrigenPositivoParaReingreso() throws Exception {
    var dto = compensacion(919L, 77L, 2);
    dto.setDevolucionId(55L);
    assertFalse(validator.validate(dto).isEmpty());
    var sinOrigen = mapper.readValue("{\"productoId\":1,\"cantidad\":1,\"entregaId\":1}", ReingresarStockDTO.class);
    assertFalse(validator.validate(sinOrigen).isEmpty());
    var origenCero = compensacion(919L, 0L, 2);
    assertFalse(validator.validate(origenCero).isEmpty());
  }

  @Test
  void compensacionesConcurrentesNoDuplicanStock() throws Exception {
    servicio.descontarStock(new DescontarStockDTO(primero.getId(), 3, 929L, false, 2L));
    var inicio = new CountDownLatch(1);
    var ejecutor = Executors.newFixedThreadPool(2);
    try {
      Callable<Void> tarea = () -> {
        RequestContext.set(new RequestContext(1L, 2L, "ADMINISTRADOR", "ventas", 200));
        try {
          inicio.await();
          servicio.reingresarStockPorDevolucion(compensacion(929L, 87L, 2));
          return null;
        } finally { RequestContext.clear(); }
      };
      var a = ejecutor.submit(tarea);
      var b = ejecutor.submit(tarea);
      inicio.countDown();
      a.get(20, TimeUnit.SECONDS);
      b.get(20, TimeUnit.SECONDS);
    } finally { ejecutor.shutdownNow(); }
    assertEquals(9, productos.findById(primero.getId()).orElseThrow().getStockFisico());
    assertEquals(1, movimientos.findByProductoIdOrderByFechaDesc(primero.getId()).stream()
        .filter(m -> m.getTipo() == TipoMovimientoInventario.COMPENSACION).count());
  }

  @Test
  void compensacionRespetaTotalEntregadoYNoCruzaEstablecimiento() throws Exception {
    servicio.descontarStock(new DescontarStockDTO(primero.getId(), 3, 939L, false, 2L));
    servicio.reingresarStockPorDevolucion(compensacion(939L, 97L, 2));
    assertThrows(IllegalStateException.class,
        () -> servicio.reingresarStockPorDevolucion(compensacion(939L, 98L, 2)));
    RequestContext.set(new RequestContext(2L, 2L, "ADMINISTRADOR", "ventas", 200));
    assertThrows(IllegalArgumentException.class,
        () -> servicio.reingresarStockPorDevolucion(compensacion(939L, 97L, 2)));
    assertEquals(9, productos.findById(primero.getId()).orElseThrow().getStockFisico());
  }

  @Test
  void resolucionesConcurrentesDeUnaSolicitudSonExcluyentes() throws Exception {
    var ejecutor = Executors.newFixedThreadPool(2);
    try {
      for (int intento = 0; intento < 20; intento++) {
        var solicitud = solicitudes.saveAndFlush(
            new SolicitudAjusteStock(primero, 1, "Diferencia detectada", 3L));
        int stockAnterior = productos.findById(primero.getId()).orElseThrow().getStockFisico();
        var inicio = new CountDownLatch(1);
        Callable<Boolean> aprobar = () -> resolverEnParalelo(inicio, () ->
            servicio.aprobarAjuste(solicitud.getId(), new AprobarAjusteDTO(2L)));
        Callable<Boolean> rechazar = () -> resolverEnParalelo(inicio, () ->
            servicio.rechazarAjuste(solicitud.getId(), new RechazarAjusteDTO(2L, "Sin evidencia")));
        var a = ejecutor.submit(aprobar);
        var b = ejecutor.submit(rechazar);
        inicio.countDown();
        boolean aprobado = a.get(20, TimeUnit.SECONDS);
        boolean rechazado = b.get(20, TimeUnit.SECONDS);
        assertNotEquals(aprobado, rechazado, "Una sola resolución debe aceptar la solicitud");
        var finalizada = solicitudes.findById(solicitud.getId()).orElseThrow();
        assertEquals(aprobado ? EstadoSolicitud.APROBADA : EstadoSolicitud.RECHAZADA,
            finalizada.getEstado());
        assertEquals(stockAnterior + (aprobado ? 1 : 0),
            productos.findById(primero.getId()).orElseThrow().getStockFisico());
        assertEquals(aprobado ? 1 : 0, movimientos.findByProductoIdOrderByFechaDesc(primero.getId())
            .stream().filter(m -> m.getTipo() == TipoMovimientoInventario.AJUSTE && m.getSolicitudAjuste() != null && solicitud.getId().equals(m.getSolicitudAjuste().getId())).count());
      }
    } finally { ejecutor.shutdownNow(); }
  }

  private boolean resolverEnParalelo(CountDownLatch inicio, Runnable accion) throws InterruptedException {
    RequestContext.set(new RequestContext(1L, 2L, "ADMINISTRADOR", "gateway", 200));
    try {
      inicio.await();
      try { accion.run(); return true; }
      catch (IllegalStateException ex) { return false; }
    } finally { RequestContext.clear(); }
  }

}
