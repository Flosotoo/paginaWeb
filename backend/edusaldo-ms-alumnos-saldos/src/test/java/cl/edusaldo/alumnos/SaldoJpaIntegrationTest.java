package cl.edusaldo.alumnos;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.dto.*;
import cl.edusaldo.alumnos.model.*;
import cl.edusaldo.alumnos.repository.*;
import cl.edusaldo.alumnos.service.SaldoService;
import java.time.LocalDate;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(
    properties = {
      "spring.datasource.url=jdbc:h2:mem:saldos-regression;MODE=MySQL;DB_CLOSE_DELAY=-1",
      "spring.datasource.driver-class-name=org.h2.Driver",
      "spring.jpa.hibernate.ddl-auto=create-drop",
      "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
      "spring.sql.init.mode=never",
      "edusaldo.interservice.enabled=false"
    })
class SaldoJpaIntegrationTest {
  @Autowired SaldoService servicio;
  @Autowired CuentaSaldoRepository cuentas;
  @Autowired AbonoRepository abonos;
  @Autowired MovimientoSaldoRepository movimientos;
  @Autowired CompromisoSaldoRepository compromisos;
  @Autowired ConstanciaDevolucionSaldoRepository constancias;
  @Autowired PlatformTransactionManager transactions;
  @Autowired org.springframework.context.ApplicationContext contexto;
  @Autowired NotificacionSaldoPendienteRepository notificaciones;
  @org.springframework.boot.test.mock.mockito.SpyBean
  cl.edusaldo.alumnos.client.UsuariosSaldosClient usuarios;
  Long alumno;

  @BeforeEach
  void iniciar() {
    alumno = System.nanoTime();
    RequestContext.set(new RequestContext(1L, 2L, "ADMINISTRADOR", "ventas", 200));
  }

  @AfterEach
  void limpiar() {
    RequestContext.clear();
  }

  private CuentaSaldo guardarCuenta(int saldo) {
    var c = new CuentaSaldo(alumno, saldo, 0);
    return cuentas.saveAndFlush(c);
  }

  @Test
  void constanciasAuditablesSoloParaAdministradorDelEstablecimiento() {
    var c = guardarCuenta(100);
    var m = movimientos.saveAndFlush(new MovimientoSaldo(c, TipoMovimientoSaldo.DEVOLUCION, 100, 0, 8L, "Retiro"));
    var propia = new ConstanciaDevolucionSaldo(c.getId(), m.getId(), 2L, 3L, 100, "EFECTIVO", "comprobante", "Retiro");
    propia.setCuentaSaldo(c); propia.setMovimientoSaldo(m);
    var guardada = constancias.saveAndFlush(propia);
    var cuentaAjenaNueva = new CuentaSaldo(alumno + 1, 50, 0); cuentaAjenaNueva.setIdEstablecimiento(2L);
    var cuentaAjena = cuentas.saveAndFlush(cuentaAjenaNueva);
    var movAjeno = movimientos.saveAndFlush(new MovimientoSaldo(cuentaAjena, TipoMovimientoSaldo.DEVOLUCION, 50, 0, 9L, "Retiro"));
    var ajena = new ConstanciaDevolucionSaldo(cuentaAjena.getId(), movAjeno.getId(), 9L, 8L, 50, "EFECTIVO", "otro", "Retiro");
    ajena.setCuentaSaldo(cuentaAjena); ajena.setMovimientoSaldo(movAjeno); constancias.saveAndFlush(ajena);
    var lista = servicio.listarConstancias();
    assertTrue(lista.stream().anyMatch(x -> x.id().equals(guardada.getId()) && x.alumnoId().equals(alumno) && x.montoClp() == 100));
    assertTrue(lista.stream().noneMatch(x -> x.id().equals(ajena.getId())));
    RequestContext.set(new RequestContext(1L, 3L, "ENCARGADO", "gateway", 200));
    assertThrows(SecurityException.class, () -> servicio.listarConstancias());
  }

  @Test
  void reservaSeConsumePorSuIdYDobleLiberacionNoTocaOtraReserva() {
    var c = guardarCuenta(10000);
    servicio.retenerSaldo(new RetenerSaldoDTO(alumno, 4000, 101L));
    servicio.retenerSaldo(new RetenerSaldoDTO(alumno, 2000, 102L));
    var cobrar = new CobrarSaldoDTO(alumno, 4000, 501L, true);
    cobrar.setReservaId(101L);
    servicio.cobrarEntrega(cobrar);
    var actual = cuentas.findById(c.getId()).orElseThrow();
    assertEquals(6000, actual.getSaldoActual());
    assertEquals(2000, actual.getSaldoComprometido());
    var liberar = new LiberarSaldoDTO(alumno, 2000, 102L);
    servicio.liberarSaldo(liberar);
    assertDoesNotThrow(() -> servicio.liberarSaldo(liberar));
    assertEquals(0, cuentas.findById(c.getId()).orElseThrow().getSaldoComprometido());
    assertEquals(
        "CONSUMIDO", compromisos.findByCuentaAndReserva(c.getId(), 101L).get(0).getEstado());
  }

  @Test
  void abonoAprobadoNoDuplicaCreditoDespuesDelVencimiento() {
    var c = guardarCuenta(100);
    var inicio = servicio.iniciarAbono(new IniciarAbonoDTO(2L, alumno, 500));
    var dto = new ConfirmarAbonoDTO(inicio.getToken());
    servicio.confirmarAbono(dto);
    new TransactionTemplate(transactions)
        .executeWithoutResult(
            status -> {
              var a =
                  abonos
                      .findByTokenTransaccionAndIdEstablecimiento(inicio.getToken(), 1L)
                      .orElseThrow();
              a.setFechaCreacion(java.time.LocalDateTime.now().minusDays(1));
            });
    servicio.confirmarAbono(dto);
    assertEquals(600, cuentas.findById(c.getId()).orElseThrow().getSaldoActual());
    assertEquals(1, movimientos.findByCuentaSaldoIdOrderByFechaDesc(c.getId()).size());
  }

  @Test
  void rechazoEsFinalSinCreditoNiMovimiento() {
    var c = guardarCuenta(100);
    var inicio = servicio.iniciarAbono(new IniciarAbonoDTO(2L, alumno, 500));
    var dto = new ConfirmarAbonoDTO(inicio.getToken());
    dto.setResultadoSimulado("RECHAZADO");
    servicio.confirmarAbono(dto);
    dto.setResultadoSimulado("APROBADO");
    servicio.confirmarAbono(dto);
    assertEquals(100, cuentas.findById(c.getId()).orElseThrow().getSaldoActual());
    assertTrue(movimientos.findByCuentaSaldoIdOrderByFechaDesc(c.getId()).isEmpty());
    new TransactionTemplate(transactions)
        .executeWithoutResult(
            status ->
                assertEquals(
                    EstadoAbono.RECHAZADO,
                    abonos
                        .findByTokenTransaccionAndIdEstablecimiento(inicio.getToken(), 1L)
                        .orElseThrow()
                        .getEstado()));
  }

  @Test
  void consultaYReporteRespetanTenantYFechas() {
    var c = guardarCuenta(100);
    var m = new MovimientoSaldo(c, TipoMovimientoSaldo.ABONO, 100, 100, 1L, "Abono");
    m.setFecha(java.time.LocalDateTime.now().minusDays(5));
    movimientos.saveAndFlush(m);
    var hoy = LocalDate.now();
    var reporte = servicio.obtenerResumenPeriodo(1L, hoy, hoy);
    assertEquals(0, reporte.get("totalAbonadoPeriodo"));
    RequestContext.set(new RequestContext(2L, 2L, "ADMINISTRADOR", "gateway", 200));
    assertEquals(0, servicio.consultarCuenta(alumno).getSaldoActual());
    assertThrows(
        IllegalArgumentException.class,
        () -> servicio.obtenerResumenPeriodo(2L, hoy, hoy.minusDays(1)));
  }

  @Test
  void falloPorMontoDistintoRevierteEstadoDelCompromiso() {
    var c = guardarCuenta(1000);
    servicio.retenerSaldo(new RetenerSaldoDTO(alumno, 400, 301L));
    var cobrar = new CobrarSaldoDTO(alumno, 500, 601L, true);
    cobrar.setReservaId(301L);
    assertThrows(IllegalStateException.class, () -> servicio.cobrarEntrega(cobrar));
    assertEquals(400, cuentas.findById(c.getId()).orElseThrow().getSaldoComprometido());
    assertEquals(
        "COMPROMETIDO", compromisos.findByCuentaAndReserva(c.getId(), 301L).get(0).getEstado());
  }

  @Test
  void reintegroNoSuperaLoCobradoEnLaEntrega() {
    var c = guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 400, 808L, false));
    var primera = new ReintegrarSaldoDTO(alumno, 300, 901L, "REFUND-901-" + alumno);
    primera.setEntregaId(808L);
    servicio.reintegrarPorDevolucion(primera);
    var exceso = new ReintegrarSaldoDTO(alumno, 200, 902L, "REFUND-902-" + alumno);
    exceso.setEntregaId(808L);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(exceso));
    assertEquals(900, cuentas.findById(c.getId()).orElseThrow().getSaldoActual());
  }

  private ReintegrarSaldoDTO compensacion(long entrega, long operacion, int monto) throws Exception {
    return new com.fasterxml.jackson.databind.ObjectMapper()
        .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
        .readValue("{\"alumnoId\":" + alumno + ",\"entregaId\":" + entrega
            + ",\"monto\":" + monto + ",\"operacionCompensacionId\":" + operacion
            + ",\"referenciaUnica\":\"COMPENSACION-" + operacion + "\"}",
            ReintegrarSaldoDTO.class);
  }

  @Test
  void compensacionParcialSeRegistraYReintentoNoDuplica() throws Exception {
    var cuenta = guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 400, alumno, false));
    var dto = compensacion(alumno, alumno, 200);
    try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
      assertTrue(factory.getValidator().validate(dto).isEmpty());
    }
    servicio.reintegrarPorDevolucion(dto);
    servicio.reintegrarPorDevolucion(dto);
    dto.setMonto(201);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(dto));
    dto.setMonto(200);
    dto.setEntregaId(alumno + 1);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(dto));
    dto.setEntregaId(alumno);
    var otroOrigen = new ReintegrarSaldoDTO(alumno, 200, alumno, "COMPENSACION-" + alumno);
    otroOrigen.setEntregaId(alumno);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(otroOrigen));
    dto.setReferenciaUnica("COMPENSACION-OTRA");
    assertThrows(IllegalArgumentException.class, () -> servicio.reintegrarPorDevolucion(dto));
    assertEquals(800, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
    var reintegros = movimientos.findByCuentaSaldoIdOrderByFechaDesc(cuenta.getId()).stream()
        .filter(m -> m.getTipo() == TipoMovimientoSaldo.DEVOLUCION).toList();
    assertEquals(1, reintegros.size());
    assertEquals(alumno, reintegros.get(0).getEntregaId());
    assertEquals(alumno, reintegros.get(0).getClass().getMethod("getOperacionCompensacionId").invoke(reintegros.get(0)));
    var exceso = new ReintegrarSaldoDTO(alumno, 201, 905L, "REFUND-905-" + alumno);
    exceso.setEntregaId(alumno);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(exceso));
  }

  @Test
  void reintentoParaOtraEntregaSeRechaza() {
    var cuenta = guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 400, alumno, false));
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 200, alumno + 1, false));
    var dto = new ReintegrarSaldoDTO(alumno, 100, 901L, "REFUND-901-" + alumno);
    dto.setEntregaId(alumno);
    servicio.reintegrarPorDevolucion(dto);
    dto.setEntregaId(alumno + 1);
    assertThrows(IllegalStateException.class, () -> servicio.reintegrarPorDevolucion(dto));
    assertEquals(500, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
  }

  @Test
  void soloSeAdmiteUnOrigenPositivo() throws Exception {
    var mapper = new com.fasterxml.jackson.databind.ObjectMapper()
        .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    try (var factory = jakarta.validation.Validation.buildDefaultValidatorFactory()) {
      var validator = factory.getValidator();
      var ambos = mapper.readValue("{\"alumnoId\":1,\"entregaId\":1,\"monto\":1,\"devolucionId\":1,\"operacionCompensacionId\":2}", ReintegrarSaldoDTO.class);
      var ninguno = mapper.readValue("{\"alumnoId\":1,\"entregaId\":1,\"monto\":1}", ReintegrarSaldoDTO.class);
      var negativo = mapper.readValue("{\"alumnoId\":1,\"entregaId\":1,\"monto\":1,\"operacionCompensacionId\":-2}", ReintegrarSaldoDTO.class);
      assertFalse(validator.validate(ambos).isEmpty());
      assertFalse(validator.validate(ninguno).isEmpty());
      assertFalse(validator.validate(negativo).isEmpty());
    }
  }

  @Test
  void solicitudesSimultaneasSoloReintegranUnaVez() throws Exception {
    var cuenta = guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 400, alumno, false));
    var lista = new java.util.concurrent.CountDownLatch(2);
    var inicio = new java.util.concurrent.CountDownLatch(1);
    var executor = java.util.concurrent.Executors.newFixedThreadPool(2);
    try {
      java.util.concurrent.Callable<Void> tarea = () -> {
        RequestContext.set(new RequestContext(1L, 2L, "ADMINISTRADOR", "ventas", 200));
        try {
          var dto = compensacion(alumno, alumno, 200);
          lista.countDown();
          if (!inicio.await(10, java.util.concurrent.TimeUnit.SECONDS)) throw new IllegalStateException("Espera agotada");
          servicio.reintegrarPorDevolucion(dto);
          return null;
        } finally { RequestContext.clear(); }
      };
      var primera = executor.submit(tarea);
      var segunda = executor.submit(tarea);
      assertTrue(lista.await(10, java.util.concurrent.TimeUnit.SECONDS));
      inicio.countDown();
      primera.get(20, java.util.concurrent.TimeUnit.SECONDS);
      segunda.get(20, java.util.concurrent.TimeUnit.SECONDS);
    } finally { executor.shutdownNow(); }
    assertEquals(800, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
    assertEquals(1, movimientos.findByCuentaSaldoIdOrderByFechaDesc(cuenta.getId()).stream()
        .filter(m -> m.getTipo() == TipoMovimientoSaldo.DEVOLUCION).count());
  }

  @Test
  void pendienteVencidoSePersisteComoExpiradoSinAcreditar() {
    var c = guardarCuenta(100);
    var inicio = servicio.iniciarAbono(new IniciarAbonoDTO(2L, alumno, 500));
    new TransactionTemplate(transactions)
        .executeWithoutResult(
            status ->
                abonos
                    .findByTokenTransaccionAndIdEstablecimiento(inicio.getToken(), 1L)
                    .orElseThrow()
                    .setFechaCreacion(java.time.LocalDateTime.now().minusDays(1)));
    assertThrows(
        cl.edusaldo.alumnos.exception.PagoExpiradoException.class,
        () -> servicio.confirmarAbono(new ConfirmarAbonoDTO(inicio.getToken())));
    new TransactionTemplate(transactions)
        .executeWithoutResult(
            status ->
                assertEquals(
                    EstadoAbono.EXPIRADO,
                    abonos
                        .findByTokenTransaccionAndIdEstablecimiento(inicio.getToken(), 1L)
                        .orElseThrow()
                        .getEstado()));
    assertEquals(100, cuentas.findById(c.getId()).orElseThrow().getSaldoActual());
    assertTrue(movimientos.findByCuentaSaldoIdOrderByFechaDesc(c.getId()).isEmpty());
  }

  @Test
  void bandejaReintentaFalloYRegistraDestinatarioYContenido() throws Exception {
    var cuenta = guardarCuenta(1000);
    var llamadas = new java.util.concurrent.atomic.AtomicInteger();
    org.mockito.Mockito.doAnswer(invocacion -> {
      assertEquals(1L, RequestContext.current().establecimiento());
      assertNull(RequestContext.current().usuario());
      assertNull(RequestContext.current().rol());
      assertEquals("saldos", RequestContext.current().caller());
      if (llamadas.getAndIncrement() == 0) throw new IllegalStateException("usuarios no disponible");
      return java.util.List.of(java.util.Map.of("id", 42L, "correo", "apoderado@example.cl", "activo", true, "idEstablecimiento", 1L));
    }).when(usuarios).apoderadosDeAlumno(alumno);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 850, alumno, false));
    assertEquals(150, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
    var aviso = notificaciones.buscarPorEstablecimiento(1L).stream()
        .filter(n -> alumno.equals(n.getAlumnoId())).findFirst().orElseThrow();
    assertEquals("PENDIENTE", aviso.getEstado());
    var procesador = contexto.getBean("procesadorNotificacionesSaldo");
    procesador.getClass().getMethod("procesar", Long.class).invoke(procesador, aviso.getId());
    aviso = notificaciones.findById(aviso.getId()).orElseThrow();
    assertEquals("PENDIENTE", aviso.getEstado());
    assertEquals(1, aviso.getIntentos());
    assertNotNull(aviso.getSiguienteIntento());
    var id = aviso.getId();
    new TransactionTemplate(transactions).executeWithoutResult(status -> {
      var n = notificaciones.findById(id).orElseThrow();
      n.setSiguienteIntento(java.time.LocalDateTime.now().minusSeconds(1));
    });
    procesador.getClass().getMethod("procesar", Long.class).invoke(procesador, id);
    aviso = notificaciones.findById(id).orElseThrow();
    assertEquals("SIMULADA", aviso.getEstado());
    assertEquals(2, aviso.getIntentos());
    var respuesta = servicio.listarNotificaciones().stream()
        .filter(n -> alumno.equals(n.get("alumnoId"))).findFirst().orElseThrow();
    assertTrue(respuesta.get("destinatarios").toString().contains("apoderado@example.cl"));
    assertTrue(respuesta.get("contenido").toString().contains("saldo"));
    assertEquals(150, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
  }

  @Test
  void bandejaDetieneReintentosTrasTresFallosYSinDestinatarios() throws Exception {
    guardarCuenta(1000);
    org.mockito.Mockito.doReturn(java.util.List.of()).when(usuarios).apoderadosDeAlumno(alumno);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 850, alumno, false));
    var id = notificaciones.buscarPorEstablecimiento(1L).stream()
        .filter(n -> alumno.equals(n.getAlumnoId())).findFirst().orElseThrow().getId();
    var procesador = contexto.getBean("procesadorNotificacionesSaldo");
    var procesar = procesador.getClass().getMethod("procesar", Long.class);
    procesar.invoke(procesador, id);
    procesar.invoke(procesador, id);
    assertEquals(1, notificaciones.findById(id).orElseThrow().getIntentos());
    for (int i = 0; i < 2; i++) {
      new TransactionTemplate(transactions).executeWithoutResult(status ->
          notificaciones.findById(id).orElseThrow().setSiguienteIntento(java.time.LocalDateTime.now().minusSeconds(1)));
      procesar.invoke(procesador, id);
    }
    var agotada = notificaciones.findById(id).orElseThrow();
    assertEquals("FALLIDA", agotada.getEstado());
    assertEquals(3, agotada.getIntentos());
    assertNull(agotada.getSiguienteIntento());
    assertNull(agotada.getDestinatariosJson());
    procesar.invoke(procesador, id);
    assertEquals(3, notificaciones.findById(id).orElseThrow().getIntentos());
    assertEquals("ADMINISTRADOR", RequestContext.current().rol());
  }

  @Test
  void familiaVeContenidoSinDatosDeDestinatariosYStaffSoloSuEstablecimiento() {
    guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 850, alumno, false));
    var id = notificaciones.buscarPorEstablecimiento(1L).stream()
        .filter(n -> alumno.equals(n.getAlumnoId())).findFirst().orElseThrow().getId();
    new TransactionTemplate(transactions).executeWithoutResult(status ->
        notificaciones.findById(id).orElseThrow().marcarSimulada("Saldo bajo",
            "[{\"id\":42,\"correo\":\"tercero@example.cl\"}]"));
    var staff = servicio.listarNotificaciones().stream().filter(n -> id.equals(n.get("id"))).findFirst().orElseThrow();
    assertTrue(staff.get("destinatarios").toString().contains("tercero@example.cl"));
    RequestContext.set(new RequestContext(1L, alumno, "ALUMNO", "gateway", 200));
    var alumnoVista = servicio.listarNotificaciones().stream().filter(n -> id.equals(n.get("id"))).findFirst().orElseThrow();
    assertEquals("Saldo bajo", alumnoVista.get("contenido"));
    assertFalse(alumnoVista.toString().contains("tercero@example.cl"));
    assertEquals(java.util.List.of(), alumnoVista.get("destinatarios"));
    org.mockito.Mockito.doReturn(java.util.Set.of(alumno)).when(usuarios).alumnosVinculados(3L);
    RequestContext.set(new RequestContext(1L, 3L, "APODERADO", "gateway", 200));
    var apoderadoVista = servicio.listarNotificaciones().stream().filter(n -> id.equals(n.get("id"))).findFirst().orElseThrow();
    assertEquals("Saldo bajo", apoderadoVista.get("contenido"));
    assertFalse(apoderadoVista.toString().contains("tercero@example.cl"));
    assertEquals(java.util.List.of(), apoderadoVista.get("destinatarios"));
    RequestContext.set(new RequestContext(2L, 8L, "ENCARGADO", "gateway", 200));
    assertTrue(servicio.listarNotificaciones().stream().noneMatch(n -> id.equals(n.get("id"))));
  }

  @Test
  void recuperarAlertaAgotadaSoloStaffDelMismoTenant() throws Exception {
    guardarCuenta(1000);
    servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 850, alumno, false));
    var id = notificaciones.buscarPorEstablecimiento(1L).stream()
        .filter(n -> alumno.equals(n.getAlumnoId())).findFirst().orElseThrow().getId();
    new TransactionTemplate(transactions).executeWithoutResult(status -> {
      var n = notificaciones.findById(id).orElseThrow(); n.setEstado("FALLIDA"); n.setIntentos(3);
    });
    RequestContext.set(new RequestContext(1L, 3L, "APODERADO", "gateway", 200));
    assertThrows(SecurityException.class, () -> servicio.recuperarNotificacion(id));
    RequestContext.set(new RequestContext(1L, alumno, "ALUMNO", "gateway", 200));
    assertThrows(SecurityException.class, () -> servicio.recuperarNotificacion(id));
    RequestContext.set(new RequestContext(2L, 8L, "ADMINISTRADOR", "gateway", 200));
    assertThrows(SecurityException.class, () -> servicio.recuperarNotificacion(id));
    assertEquals("FALLIDA", notificaciones.findById(id).orElseThrow().getEstado());
    RequestContext.set(new RequestContext(1L, 8L, "ENCARGADO", "gateway", 200));
    servicio.recuperarNotificacion(id);
    var recuperada = notificaciones.findById(id).orElseThrow();
    assertEquals("PENDIENTE", recuperada.getEstado());
    assertEquals(0, recuperada.getIntentos());
    assertNull(recuperada.getSiguienteIntento());
    assertThrows(IllegalStateException.class, () -> servicio.recuperarNotificacion(id));
    org.mockito.Mockito.doReturn(java.util.List.of(java.util.Map.of("id", 42L, "activo", true, "idEstablecimiento", 1L)))
        .when(usuarios).apoderadosDeAlumno(alumno);
    var procesador = contexto.getBean("procesadorNotificacionesSaldo");
    procesador.getClass().getMethod("procesar", Long.class).invoke(procesador, id);
    assertEquals("SIMULADA", notificaciones.findById(id).orElseThrow().getEstado());
    assertEquals(1, notificaciones.findById(id).orElseThrow().getIntentos());
  }

  @Test
  void alertaUsaUmbralDelContextoYNotificacionSimuladaSinDestinatariosInventados() {
    guardarCuenta(1000);
    org.mockito.Mockito.doReturn(java.util.List.of()).when(usuarios).apoderadosDeAlumno(alumno);
    var respuesta =
        servicio.cobrarEntrega(new CobrarSaldoDTO(alumno, 850, System.nanoTime(), false));
    assertTrue(respuesta.isAlertaSaldoBajo());
    var notificaciones =
        servicio.listarNotificaciones().stream()
            .filter(n -> alumno.equals(n.get("alumnoId")))
            .toList();
    assertEquals(1, notificaciones.size());
    assertEquals("PENDIENTE", notificaciones.get(0).get("estado"));
    assertEquals(java.util.List.of(), notificaciones.get(0).get("destinatarios"));
  }
  @Test void liquidacionRegistraComprobanteUnicoYNoAceptaRepeticion() {
    var cuenta = guardarCuenta(1000);
    var dto = new LiquidarSaldoDTO(alumno, 3L, "EFECTIVO", "REC-UNICO-" + alumno, "Retiro");
    servicio.liquidarSaldoPorRetiro(dto);
    assertEquals(0, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
    assertTrue(constancias.existsByCuentaSaldoIdAndReferencia(cuenta.getId(), dto.getComprobante()));
    new TransactionTemplate(transactions).executeWithoutResult(status -> {
      var c = cuentas.findById(cuenta.getId()).orElseThrow(); c.abonar(500); cuentas.save(c);
    });
    assertThrows(IllegalStateException.class, () -> servicio.liquidarSaldoPorRetiro(dto));
    assertEquals(500, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
    var otra = new LiquidarSaldoDTO(alumno, 3L, "EFECTIVO", "OTRO-" + alumno, "Retiro");
    servicio.liquidarSaldoPorRetiro(otra);
    assertEquals(0, cuentas.findById(cuenta.getId()).orElseThrow().getSaldoActual());
  }

}
