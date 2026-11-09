package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import cl.edusaldo.ventas.client.*;
import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.repository.*;
import cl.edusaldo.ventas.service.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.*;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:recuperacion;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.datasource.username=sa",
      "spring.datasource.password=",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.sql.init.mode=never",
      "spring.jpa.open-in-view=false",
      "edusaldo.notificaciones.asincronas.enabled=false",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
    })
class RecuperacionPersistenteTest {
  @Autowired EntregaService entregas;
  @Autowired DevolucionService devoluciones;
  @Autowired ReservaService reservas;
  @Autowired OperacionService recuperacion;
  @Autowired ReservaRepository reservaRepo;
  @Autowired DevolucionRepository devolucionRepo;
  @Autowired NotificacionPendienteRepository notificaciones;
  @Autowired EntregaRepository entregaRepo;
  @Autowired OperacionDistribuidaRepository operaciones;
  @Autowired ProcesadorNotificaciones procesador;
  @MockBean SaldosClient saldos;
  @MockBean InventarioClient inventario;
  @MockBean UsuariosClient usuarios;

  @BeforeEach
  void contexto() {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.addHeader("X-Establecimiento-Id", "7");
    request.addHeader("X-Usuario-Id", "2");
    request.addHeader("X-Rol", "ENCARGADO");
    request.addHeader("X-Umbral-Saldo-Bajo", "1000");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    when(usuarios.puedeConsultarAlumno(anyLong())).thenReturn(true);
    when(usuarios.correosApoderados(anyLong())).thenReturn(List.of("familia.real@example.cl"));
    when(inventario.consultarProductoActivo(anyLong()))
        .thenReturn(Map.of("precio", 1000, "nombre", "Material", "stockDisponible", 100));
  }

  @AfterEach
  void limpiarContexto() {
    RequestContextHolder.resetRequestAttributes();
  }

  EntregaMesonDTO meson(Long producto) {
    EntregaMesonDTO d = new EntregaMesonDTO();
    d.setAlumnoId(4L);
    d.setEncargadoId(2L);
    ItemEntregaDTO i = new ItemEntregaDTO();
    i.setProductoId(producto);
    i.setCantidad(2);
    i.setPrecioUnitario(1000);
    d.setItems(List.of(i));
    return d;
  }

  @Test
  void entregaSinStockSeRechazaAntesDeCrearCabeceraOCobrar() {
    when(inventario.consultarProductoActivo(200L))
        .thenReturn(Map.of("precio", 1000, "nombre", "Material", "stockDisponible", 1));
    long antes = entregaRepo.count();
    assertThrows(IllegalStateException.class, () -> entregas.registrarEntregaMeson(meson(200L)));
    assertEquals(antes, entregaRepo.count());
    verifyNoInteractions(saldos);
  }

  @Test
  void caidaDeUsuariosNoRevierteEntregaYDejaNotificacionRecuperable() {
    when(usuarios.correosApoderados(4L)).thenThrow(new IllegalStateException("no disponible"));
    Entrega entrega = entregas.registrarEntregaMeson(meson(201L));
    assertEquals("COMPLETADA", entrega.getEstadoOperacion());
    var pendiente =
        notificaciones.findByIdEstablecimientoOrderByFechaCreacionDesc(7L).stream()
            .filter(
                n -> entrega.getId().equals(n.getEntregaId()) && n.getEstado().equals("PENDIENTE"))
            .findFirst()
            .orElseThrow();
    assertNull(pendiente.getDestinatarioCorreo());
    assertNull(pendiente.getFechaEnvio());
    doReturn(List.of("familia.real@example.cl")).when(usuarios).correosApoderados(4L);
    recuperacion.procesarNotificacion(pendiente.getId());
    var resuelta = notificaciones.findById(pendiente.getId()).orElseThrow();
    assertEquals("SIMULADA", resuelta.getEstado());
    assertEquals("familia.real@example.cl", resuelta.getDestinatarioCorreo());
    assertNull(resuelta.getFechaEnvio());
  }

  @Test
  void procesadorReintentaConElEstablecimientoDelEvento() {
    var evento = NotificacionPendiente.pendiente(null, null, 774L, "RESERVA", 777L);
    evento = notificaciones.saveAndFlush(evento);
    Long id = evento.getId();
    doAnswer(
            call -> {
              assertEquals(
                  "777",
                  cl.edusaldo.ventas.config.ContextoSolicitud.header("X-Establecimiento-Id"));
              throw new IllegalStateException("Usuarios no disponible");
            })
        .when(usuarios)
        .correosApoderados(774L);
    procesador.procesarPendientes();
    var fallida = notificaciones.findById(id).orElseThrow();
    assertEquals("PENDIENTE", fallida.getEstado());
    assertEquals(1, fallida.getIntentos());
    assertNotNull(fallida.getSiguienteIntento());
    fallida.setSiguienteIntento(java.time.LocalDateTime.now().minusSeconds(1));
    notificaciones.saveAndFlush(fallida);
    doReturn(List.of("familia@example.cl")).when(usuarios).correosApoderados(774L);
    procesador.procesarPendientes();
    var resuelta = notificaciones.findById(id).orElseThrow();
    assertEquals("SIMULADA", resuelta.getEstado());
    assertEquals(2, resuelta.getIntentos());
    assertEquals("familia@example.cl", resuelta.getDestinatarioCorreo());
    assertNull(resuelta.getFechaEnvio());
  }

  @Test
  void procesadorLimitaIntentosYPersonalPuedeReanudar() {
    var evento = NotificacionPendiente.pendiente(null, null, 775L, "ENTREGA", 7L);
    evento.setIntentos(4);
    evento = notificaciones.saveAndFlush(evento);
    Long id = evento.getId();
    doThrow(new IllegalStateException("Usuarios no disponible"))
        .when(usuarios)
        .correosApoderados(775L);
    procesador.procesarPendientes();
    var agotada = notificaciones.findById(id).orElseThrow();
    assertEquals("ERROR_REINTENTOS", agotada.getEstado());
    assertEquals(5, agotada.getIntentos());
    assertNull(agotada.getSiguienteIntento());
    doReturn(List.of("familia@example.cl")).when(usuarios).correosApoderados(775L);
    recuperacion.procesarNotificacion(id);
    assertEquals("SIMULADA", notificaciones.findById(id).orElseThrow().getEstado());
  }

  @Test
  void reservaDeProcesamientoInterrumpidaNoEludeElLimite() {
    var evento = NotificacionPendiente.pendiente(null, null, 776L, "ENTREGA", 777L);
    evento.setIntentos(5);
    evento.setSiguienteIntento(java.time.LocalDateTime.now().minusSeconds(1));
    evento = notificaciones.saveAndFlush(evento);
    procesador.procesarPendientes();
    var agotada = notificaciones.findById(evento.getId()).orElseThrow();
    assertEquals("ERROR_REINTENTOS", agotada.getEstado());
    assertEquals(5, agotada.getIntentos());
    verify(usuarios, never()).correosApoderados(776L);
  }

  @Test
  void personalNoProcesaEventosDeOtroEstablecimiento() {
    var evento =
        notificaciones.saveAndFlush(
            NotificacionPendiente.pendiente(null, null, 777L, "ENTREGA", 8L));
    var error =
        assertThrows(
            org.springframework.web.server.ResponseStatusException.class,
            () -> recuperacion.procesarNotificacion(evento.getId()));
    assertEquals(404, error.getStatusCode().value());
    assertEquals("PENDIENTE", notificaciones.findById(evento.getId()).orElseThrow().getEstado());
    verify(usuarios, never()).correosApoderados(777L);
  }

  @Test
  void stockCambiaTrasConsultaReintegraYNoDejaOperacionPendiente() {
    doThrow(new cl.edusaldo.ventas.exception.RechazoRemotoException("Stock insuficiente", null))
        .doNothing()
        .when(inventario)
        .descontarStock(eq(202L), eq(2), eq(false), eq(2L), anyLong(), isNull());
    assertThrows(
        cl.edusaldo.ventas.exception.RechazoRemotoException.class,
        () -> entregas.registrarEntregaMeson(meson(202L)));
    var pendiente =
        operaciones.findAll().stream()
            .filter(o -> "ENTREGA_MESON".equals(o.getTipo()))
            .max(Comparator.comparing(OperacionDistribuida::getId))
            .orElseThrow();
    assertEquals("COMPENSADA", pendiente.getEstado());
    verify(saldos)
        .compensarEntrega(eq(4L), eq(2000), eq(pendiente.getId()), eq(pendiente.getEntregaId()));
    verify(saldos, times(1))
        .descontarSaldo(eq(4L), eq(2000), eq(false), anyString(), anyLong(), isNull());
  }

  @Test
  void compensacionInterrumpidaRetomaSinRepetirStockRestituido() {
    EntregaMesonDTO dto = meson(203L);
    ItemEntregaDTO segundo = new ItemEntregaDTO();
    segundo.setProductoId(204L);
    segundo.setCantidad(1);
    segundo.setPrecioUnitario(1000);
    dto.setItems(List.of(dto.getItems().get(0), segundo));
    doThrow(new cl.edusaldo.ventas.exception.RechazoRemotoException("Stock insuficiente", null))
        .when(inventario)
        .descontarStock(eq(204L), anyInt(), eq(false), eq(2L), anyLong(), isNull());
    doThrow(new IllegalStateException("Saldos no disponible"))
        .doNothing()
        .when(saldos)
        .compensarEntrega(eq(4L), eq(3000), anyLong(), anyLong());
    var error =
        assertThrows(
            cl.edusaldo.ventas.exception.OperacionPendienteException.class,
            () -> entregas.registrarEntregaMeson(dto));
    var op = recuperacion.obtener(error.getOperacionId());
    assertEquals("PENDIENTE_RECUPERACION", op.getEstado());
    assertEquals("COMPENSAR", op.getDireccion());
    assertEquals("COMPENSADA", recuperacion.recuperar(op.getId()).getEstado());
    assertEquals("COMPENSADA", recuperacion.recuperar(op.getId()).getEstado());
    verify(inventario, times(1))
        .compensarEntrega(eq(203L), eq(2), eq(2L), eq(op.getId()), eq(op.getEntregaId()));
    verify(saldos, times(2))
        .compensarEntrega(eq(4L), eq(3000), eq(op.getId()), eq(op.getEntregaId()));
  }

  @Test
  void duplicateProductsRejectedBeforeAnyExternalCall() {
    EntregaMesonDTO dto = meson(9L);
    dto.setItems(List.of(dto.getItems().get(0), dto.getItems().get(0)));
    assertThrows(IllegalArgumentException.class, () -> entregas.registrarEntregaMeson(dto));
    verifyNoInteractions(saldos);
    verify(inventario, never()).consultarProductoActivo(anyLong());
  }

  @Test
  void ambiguousChargeKeepsCommittedHeaderAndRecoveryRecord() {
    doThrow(
            new IllegalStateException(
                "timeout", new org.springframework.web.client.ResourceAccessException("timeout")))
        .when(saldos)
        .descontarSaldo(
            anyLong(), anyInt(), anyBoolean(), anyString(), anyLong(), nullable(Long.class));
    long count = entregaRepo.count();
    assertThrows(IllegalStateException.class, () -> entregas.registrarEntregaMeson(meson(10L)));
    assertEquals(count + 1, entregaRepo.count(), "La cabecera debe sobrevivir al fallo remoto");
    assertTrue(
        operaciones.findAll().stream()
            .anyMatch(
                o ->
                    o.getEstado().equals("PENDIENTE_RECUPERACION")
                        && o.getIdEstablecimiento().equals(7L)));
  }

  @Test
  void repeatedReturnDetailRejectedWithoutMutatingOriginalQuantity() {
    Entrega e = new Entrega("PRUEBA-" + UUID.randomUUID(), null, 4L, OrigenEntrega.MESON, 2000, 2L);
    e.setIdEstablecimiento(7L);
    e.agregarDetalle(8L, "Material", 2, 1000);
    e = entregaRepo.saveAndFlush(e);
    ItemDevolucionDTO i = new ItemDevolucionDTO();
    i.setDetalleEntregaId(e.getDetalles().get(0).getId());
    i.setCantidad(1);
    CrearDevolucionDTO d = new CrearDevolucionDTO();
    d.setEntregaId(e.getId());
    d.setEncargadoId(2L);
    d.setMotivo("Falla");
    d.setItems(List.of(i, i));
    assertThrows(IllegalArgumentException.class, () -> devoluciones.registrarDevolucion(d));
    assertEquals(0, entregas.obtenerPorId(e.getId()).getDetalles().get(0).getCantidadDevuelta());
    verifyNoInteractions(saldos);
  }

  Reserva lista() {
    Reserva r = new Reserva("R-" + UUID.randomUUID(), 4L, 2L, 2000);
    r.setIdEstablecimiento(7L);
    r.agregarDetalle(9L, "Material", 2, 1000);
    r.marcarListaParaRetiro(2L);
    return reservaRepo.saveAndFlush(r);
  }

  CrearDevolucionDTO devolver(Entrega e, int cantidad) {
    ItemDevolucionDTO i = new ItemDevolucionDTO();
    i.setDetalleEntregaId(e.getDetalles().get(0).getId());
    i.setCantidad(cantidad);
    CrearDevolucionDTO d = new CrearDevolucionDTO();
    d.setEntregaId(e.getId());
    d.setEncargadoId(2L);
    d.setMotivo("Defecto");
    d.setItems(List.of(i));
    return d;
  }

  void contextoHilo() {
    MockHttpServletRequest r = new MockHttpServletRequest();
    r.addHeader("X-Establecimiento-Id", "7");
    r.addHeader("X-Usuario-Id", "2");
    r.addHeader("X-Rol", "ENCARGADO");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(r));
  }

  @Test
  void retryAfterAmbiguousEffectUsesSameDeliveryAndDoesNotChargeTwice() {
    Set<Long> cobros = new HashSet<>();
    java.util.concurrent.atomic.AtomicBoolean timeout =
        new java.util.concurrent.atomic.AtomicBoolean(true);
    doAnswer(
            call -> {
              cobros.add(call.getArgument(4));
              if (timeout.getAndSet(false)) throw new IllegalStateException("timeout");
              return null;
            })
        .when(saldos)
        .descontarSaldo(
            anyLong(), anyInt(), anyBoolean(), anyString(), anyLong(), nullable(Long.class));
    var ex =
        assertThrows(
            cl.edusaldo.ventas.exception.OperacionPendienteException.class,
            () -> entregas.registrarEntregaMeson(meson(11L)));
    OperacionDistribuida antes = recuperacion.obtener(ex.getOperacionId());
    Long entregaId = antes.getEntregaId();
    assertEquals("PENDIENTE_RECUPERACION", entregas.obtenerPorId(entregaId).getEstadoOperacion());
    assertEquals("COMPLETADA", recuperacion.recuperar(antes.getId()).getEstado());
    assertEquals("COMPLETADA", recuperacion.recuperar(antes.getId()).getEstado());
    assertEquals(Set.of(entregaId), cobros);
    assertEquals(2000, entregas.obtenerPorId(entregaId).getTotal());
    assertEquals("COMPLETADA", entregas.obtenerPorId(entregaId).getEstadoOperacion());
    procesador.procesarPendientes();
    assertTrue(
        notificaciones.findByIdEstablecimientoOrderByFechaCreacionDesc(7L).stream()
            .anyMatch(
                n ->
                    entregaId.equals(n.getEntregaId())
                        && n.getDestinatarioCorreo().equals("familia.real@example.cl")
                        && n.getEstado().equals("SIMULADA")));
  }

  @Test
  void retiroClaimsReservationBeforeRemoteChargeAndBlocksCancellation() throws Exception {
    Reserva r = lista();
    var inicio = new java.util.concurrent.CountDownLatch(1);
    var continuar = new java.util.concurrent.CountDownLatch(1);
    doAnswer(
            call -> {
              inicio.countDown();
              assertTrue(continuar.await(5, java.util.concurrent.TimeUnit.SECONDS));
              return null;
            })
        .when(saldos)
        .descontarSaldo(anyLong(), anyInt(), eq(true), anyString(), anyLong(), eq(r.getId()));
    var futuro =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              contextoHilo();
              try {
                return reservas.entregarReserva(r.getId(), 2L);
              } finally {
                RequestContextHolder.resetRequestAttributes();
              }
            });
    assertTrue(inicio.await(5, java.util.concurrent.TimeUnit.SECONDS));
    try {
      var ex =
          assertThrows(
              org.springframework.web.server.ResponseStatusException.class,
              () -> reservas.cancelarReserva(r.getId(), "Intento concurrente", 2L, "ENCARGADO"));
      assertEquals(409, ex.getStatusCode().value());
      assertEquals(EstadoReserva.LISTA_PARA_RETIRO, reservas.obtenerPorId(r.getId()).getEstado());
    } finally {
      continuar.countDown();
    }
    Entrega e = futuro.get(5, java.util.concurrent.TimeUnit.SECONDS);
    assertEquals(r.getId(), e.getReservaId());
    assertEquals(EstadoReserva.ENTREGADA, reservas.obtenerPorId(r.getId()).getEstado());
    assertThrows(
        IllegalStateException.class,
        () -> reservas.cancelarReserva(r.getId(), "Tarde", 2L, "ENCARGADO"));
    assertEquals(
        1,
        entregaRepo.findByIdEstablecimientoOrderByIdDesc(7L).stream()
            .filter(i -> r.getId().equals(i.getReservaId()))
            .count());
  }

  @Test
  void concurrentReturnsCannotBothClaimSameUnits() throws Exception {
    Entrega e = entregas.registrarEntregaMeson(meson(12L));
    var inicio = new java.util.concurrent.CountDownLatch(1);
    var continuar = new java.util.concurrent.CountDownLatch(1);
    doAnswer(
            call -> {
              inicio.countDown();
              assertTrue(continuar.await(5, java.util.concurrent.TimeUnit.SECONDS));
              return null;
            })
        .when(saldos)
        .reintegrarSaldo(anyLong(), anyInt(), anyString(), anyLong(), anyLong(), eq(e.getId()));
    var futuro =
        java.util.concurrent.CompletableFuture.supplyAsync(
            () -> {
              contextoHilo();
              try {
                return devoluciones.registrarDevolucion(devolver(e, 2));
              } finally {
                RequestContextHolder.resetRequestAttributes();
              }
            });
    assertTrue(inicio.await(5, java.util.concurrent.TimeUnit.SECONDS));
    try {
      var ex =
          assertThrows(
              org.springframework.web.server.ResponseStatusException.class,
              () -> devoluciones.registrarDevolucion(devolver(e, 1)));
      assertEquals(409, ex.getStatusCode().value());
      assertEquals(0, entregas.obtenerPorId(e.getId()).getDetalles().get(0).getCantidadDevuelta());
    } finally {
      continuar.countDown();
    }
    Devolucion d = futuro.get(5, java.util.concurrent.TimeUnit.SECONDS);
    assertEquals(2000, d.getTotalReintegro());
    assertEquals(2, entregas.obtenerPorId(e.getId()).getDetalles().get(0).getCantidadDevuelta());
    assertThrows(
        IllegalStateException.class, () -> devoluciones.registrarDevolucion(devolver(e, 1)));
  }

  @Test
  void compensationFailurePersistsDirectionAndOnlyReleasesConfirmedSteps() {
    doThrow(new cl.edusaldo.ventas.exception.RechazoRemotoException("Stock insuficiente", null))
        .when(inventario)
        .reservarStock(eq(22L), anyInt(), anyLong(), anyLong());
    doThrow(new IllegalStateException("No disponible"))
        .when(saldos)
        .liberarSaldo(anyLong(), anyInt(), anyString(), anyLong());
    CrearReservaDTO d = new CrearReservaDTO();
    d.setAlumnoId(4L);
    d.setCreadaPorId(2L);
    d.setItems(
        List.of(new ItemReservaDTO(21L, "A", 1, 1000), new ItemReservaDTO(22L, "B", 1, 1000)));
    var ex =
        assertThrows(
            cl.edusaldo.ventas.exception.OperacionPendienteException.class,
            () -> reservas.crearReserva(d));
    OperacionDistribuida op = recuperacion.obtener(ex.getOperacionId());
    assertEquals("COMPENSAR", op.getDireccion());
    assertEquals("PENDIENTE_RECUPERACION", op.getEstado());
    assertEquals(EstadoReserva.PENDIENTE, reservas.obtenerPorId(op.getReservaId()).getEstado());
    doNothing().when(saldos).liberarSaldo(anyLong(), anyInt(), anyString(), anyLong());
    assertEquals("COMPENSADA", recuperacion.recuperar(op.getId()).getEstado());
    assertEquals("COMPENSADA", recuperacion.recuperar(op.getId()).getEstado());
    assertEquals(EstadoReserva.CANCELADA, reservas.obtenerPorId(op.getReservaId()).getEstado());
    verify(inventario).liberarStock(21L, 1, 2L, op.getReservaId());
    verify(inventario, never()).liberarStock(eq(22L), anyInt(), anyLong(), anyLong());
  }

  @Test
  void historicalRepeatedProductsAreGroupedWhenReturningStock() {
    Entrega e = new Entrega("HIST-" + UUID.randomUUID(), null, 4L, OrigenEntrega.MESON, 3000, 2L);
    e.setIdEstablecimiento(7L);
    e.agregarDetalle(33L, "M", 1, 1000);
    e.agregarDetalle(33L, "M", 2, 1000);
    e = entregaRepo.saveAndFlush(e);
    CrearDevolucionDTO d = devolver(e, 1);
    ItemDevolucionDTO segundo = new ItemDevolucionDTO();
    segundo.setDetalleEntregaId(e.getDetalles().get(1).getId());
    segundo.setCantidad(2);
    d.setItems(List.of(d.getItems().get(0), segundo));
    Devolucion dev = devoluciones.registrarDevolucion(d);
    assertEquals(3000, dev.getTotalReintegro());
    assertEquals(
        3,
        entregas.obtenerPorId(e.getId()).getDetalles().stream()
            .mapToInt(DetalleEntrega::getCantidadDevuelta)
            .sum());
    verify(inventario).reingresarStock(33L, 3, 2L, "Defecto", dev.getId(), e.getId());
  }

  @Test
  void tenantCannotReadOrRecoverAnotherTenantsOperation() {
    Entrega e = entregas.registrarEntregaMeson(meson(15L));
    Long op =
        recuperacion.listar().stream()
            .filter(o -> e.getId().equals(o.getEntregaId()))
            .findFirst()
            .orElseThrow()
            .getId();
    MockHttpServletRequest r = new MockHttpServletRequest();
    r.addHeader("X-Establecimiento-Id", "8");
    r.addHeader("X-Usuario-Id", "3");
    r.addHeader("X-Rol", "ADMINISTRADOR");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(r));
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () -> entregas.obtenerPorId(e.getId()));
    assertThrows(
        org.springframework.web.server.ResponseStatusException.class,
        () -> recuperacion.recuperar(op));
    assertTrue(recuperacion.listar().isEmpty());
  }

  @Test
  void databasePreventsTwoDeliveriesForOneReservationAndAllowsMultipleCounterDeliveries() {
    Reserva r = lista();
    Entrega first =
        new Entrega("ONE-" + UUID.randomUUID(), r.getId(), 4L, OrigenEntrega.RESERVA, 2000, 2L);
    first.setIdEstablecimiento(7L);
    entregaRepo.saveAndFlush(first);
    Entrega duplicate =
        new Entrega("TWO-" + UUID.randomUUID(), r.getId(), 4L, OrigenEntrega.RESERVA, 2000, 2L);
    duplicate.setIdEstablecimiento(7L);
    assertThrows(
        org.springframework.dao.DataIntegrityViolationException.class,
        () -> entregaRepo.saveAndFlush(duplicate));
    Entrega a = entregas.registrarEntregaMeson(meson(31L)),
        b = entregas.registrarEntregaMeson(meson(32L));
    assertNotEquals(a.getId(), b.getId());
    assertNull(a.getReservaId());
    assertNull(b.getReservaId());
  }

  @Test
  void reservationPreparationAndFamilyCancellationKeepOfficialStateRules() {
    CrearReservaDTO d = new CrearReservaDTO();
    d.setAlumnoId(4L);
    d.setCreadaPorId(2L);
    d.setItems(List.of(new ItemReservaDTO(51L, "Material", 2, 1000)));
    Reserva r = reservas.crearReserva(d);
    assertEquals(2000, r.getTotal());
    assertEquals(EstadoReserva.PENDIENTE, r.getEstado());
    r = reservas.marcarListaParaRetiro(r.getId(), 2L);
    assertEquals(EstadoReserva.LISTA_PARA_RETIRO, r.getEstado());
    assertEquals(2L, r.getPreparadaPorId());
    assertNotNull(r.getFechaPreparacion());
    Long id = r.getId();
    assertThrows(IllegalStateException.class, () -> reservas.marcarListaParaRetiro(id, 2L));
    Reserva cancelada = reservas.cancelarReserva(id, "No requiere", 2L, "ENCARGADO");
    assertEquals(EstadoReserva.CANCELADA, cancelada.getEstado());
    assertThrows(IllegalStateException.class, () -> reservas.entregarReserva(id, 2L));
  }

  @Test
  void recoveryByDifferentStaffPreservesOriginalActorAndRecordsRecoverer() {
    MockHttpServletRequest r = new MockHttpServletRequest();
    r.addHeader("X-Establecimiento-Id", "7");
    r.addHeader("X-Usuario-Id", "3");
    r.addHeader("X-Rol", "APODERADO");
    r.addHeader("X-Umbral-Saldo-Bajo", "2500");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(r));
    var actores = new ArrayList<String>();
    java.util.concurrent.atomic.AtomicBoolean timeout =
        new java.util.concurrent.atomic.AtomicBoolean(true);
    doAnswer(
            call -> {
              actores.add(
                  cl.edusaldo.ventas.config.ContextoSolicitud.header("X-Usuario-Id")
                      + ":"
                      + cl.edusaldo.ventas.config.ContextoSolicitud.header("X-Rol"));
              if (timeout.getAndSet(false)) throw new IllegalStateException("timeout");
              return null;
            })
        .when(saldos)
        .comprometerSaldo(anyLong(), anyInt(), anyString(), anyLong());
    CrearReservaDTO d = new CrearReservaDTO();
    d.setAlumnoId(4L);
    d.setCreadaPorId(3L);
    d.setItems(List.of(new ItemReservaDTO(70L, "Material", 1, 1000)));
    var ex =
        assertThrows(
            cl.edusaldo.ventas.exception.OperacionPendienteException.class,
            () -> reservas.crearReserva(d));
    contextoHilo();
    recuperacion.recuperar(ex.getOperacionId());
    assertEquals(2L, recuperacion.obtener(ex.getOperacionId()).getRecuperadaPorId());
    assertEquals(List.of("3:APODERADO", "3:APODERADO"), actores);
    assertEquals(2L, cl.edusaldo.ventas.config.ContextoSolicitud.usuario(null));
  }

  @Test
  void preparationReturnsDetachedDtoReadyDetailsAndNotificationAtomically() {
    Reserva r = new Reserva("P-" + UUID.randomUUID(), 4L, 2L, 2000);
    r.setIdEstablecimiento(7L);
    r.agregarDetalle(90L, "Material", 2, 1000);
    r = reservaRepo.saveAndFlush(r);
    Reserva preparada = reservas.marcarListaParaRetiro(r.getId(), 2L);
    assertEquals(2000, new ReservaResponseDTO(preparada).getItems().get(0).getSubtotal());
    assertTrue(
        notificaciones.findByIdEstablecimientoOrderByFechaCreacionDesc(7L).stream()
            .anyMatch(
                n ->
                    preparada.getId().equals(n.getReservaId())
                        && n.getTipoEvento().equals("RESERVA_LISTA_RETIRO")));
  }

  @Test
  void unavailableRecipientsDoNotBlockPreparation() {
    Reserva r = new Reserva("P-" + UUID.randomUUID(), 4L, 2L, 2000);
    r.setIdEstablecimiento(7L);
    r.agregarDetalle(91L, "Material", 2, 1000);
    r = reservaRepo.saveAndFlush(r);
    Long id = r.getId();
    when(usuarios.correosApoderados(4L))
        .thenThrow(new IllegalStateException("Servicio no disponible"));
    reservas.marcarListaParaRetiro(id, 2L);
    assertEquals(EstadoReserva.LISTA_PARA_RETIRO, reservas.obtenerPorId(id).getEstado());
    assertTrue(
        notificaciones.findByIdEstablecimientoOrderByFechaCreacionDesc(7L).stream()
            .anyMatch(n -> id.equals(n.getReservaId()) && "PENDIENTE".equals(n.getEstado())));
  }

  @Test
  void procesamientoConcurrenteSoloConfirmaQuienReclamaEvento() throws Exception {
    var evento =
        notificaciones.saveAndFlush(
            NotificacionPendiente.pendiente(null, null, 7654L, "LISTA", 7L));
    var inicio = new java.util.concurrent.CountDownLatch(1);
    var continuar = new java.util.concurrent.CountDownLatch(1);
    when(usuarios.correosApoderados(7654L))
        .thenAnswer(
            inv -> {
              inicio.countDown();
              if (!continuar.await(10, java.util.concurrent.TimeUnit.SECONDS))
                throw new IllegalStateException("Tiempo agotado");
              return List.of("familia@example.cl");
            });
    var executor = java.util.concurrent.Executors.newSingleThreadExecutor();
    try {
      var primero =
          executor.submit(
              () -> {
                var request = new MockHttpServletRequest();
                request.addHeader("X-Establecimiento-Id", "7");
                request.addHeader("X-Usuario-Id", "2");
                request.addHeader("X-Rol", "ENCARGADO");
                RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
                try {
                  recuperacion.procesarNotificacion(evento.getId());
                } finally {
                  RequestContextHolder.resetRequestAttributes();
                }
              });
      assertTrue(inicio.await(10, java.util.concurrent.TimeUnit.SECONDS));
      var ocupada =
          assertThrows(
              org.springframework.web.server.ResponseStatusException.class,
              () -> recuperacion.procesarNotificacion(evento.getId()));
      assertEquals(409, ocupada.getStatusCode().value());
      continuar.countDown();
      primero.get(10, java.util.concurrent.TimeUnit.SECONDS);
      assertEquals("SIMULADA", notificaciones.findById(evento.getId()).orElseThrow().getEstado());
      var yaProcesada =
          assertThrows(
              org.springframework.web.server.ResponseStatusException.class,
              () -> recuperacion.procesarNotificacion(evento.getId()));
      assertEquals(409, yaProcesada.getStatusCode().value());
      verify(usuarios, times(1)).correosApoderados(7654L);
    } finally {
      continuar.countDown();
      executor.shutdownNow();
    }
  }
}
