package cl.edusaldo.alumnos.client;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.repository.*;
import cl.edusaldo.alumnos.service.SaldoService;
import java.util.List;
import org.junit.jupiter.api.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class ConsultasFamiliaresTest {
  private AbonoRepository abonos;
  private SaldoService servicio;
  private UsuariosSaldosClient usuarios;
  private MockRestServiceServer servidor;

  @BeforeEach void iniciar() {
    RequestContext.set(new RequestContext(1L, 3L, "APODERADO", "gateway", 3000));
    abonos = mock(AbonoRepository.class);
    servicio = new SaldoService(mock(CuentaSaldoRepository.class), mock(MovimientoSaldoRepository.class), abonos);
    usuarios = new UsuariosSaldosClient();
    RestTemplate rest = new RestTemplate();
    servidor = MockRestServiceServer.bindTo(rest).build();
    ReflectionTestUtils.setField(usuarios, "restTemplate", rest);
    ReflectionTestUtils.setField(servicio, "usuariosSaldosClient", usuarios);
  }

  @AfterEach void limpiar() { RequestContext.clear(); }

  @Test void soloRetornaAbonosDeAlumnosActualmenteVinculados() {
    Abono permitido = new Abono(3L, 4L, 1000);
    Abono desvinculado = new Abono(3L, 5L, 2000);
    Abono otroApoderado = new Abono(8L, 4L, 3000);
    when(abonos.findAllByIdEstablecimiento(1L)).thenReturn(List.of(permitido, desvinculado, otroApoderado));
    servidor.expect(once(), requestTo("http://localhost:8091/api/usuarios/apoderados/3/alumnos"))
        .andRespond(withSuccess("[{\"id\":4}]", MediaType.APPLICATION_JSON));
    assertEquals(List.of(permitido), servicio.listarAbonos(null, null));
    servidor.verify();
    verify(abonos).findAllByIdEstablecimiento(1L);
  }

  @Test void fallaDependenciaNoSeConvierteEnListaVacia() {
    servidor.expect(once(), requestTo("http://localhost:8091/api/usuarios/apoderados/3/alumnos"))
        .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
    assertThrows(RuntimeException.class, () -> servicio.listarAbonos(null, null));
    servidor.verify();
  }

  @Test void cuerpoNuloDeAuthNoSeTrataComoListaVacia() {
    servidor.expect(once(), requestTo("http://localhost:8091/api/usuarios/alumnos/4/apoderados"))
        .andRespond(withSuccess("", MediaType.APPLICATION_JSON));
    assertThrows(RuntimeException.class, () -> usuarios.apoderadosDeAlumno(4L));
    servidor.verify();
  }

  @Test void clienteAusenteNoSeTrataComoSinNotificaciones() {
    ReflectionTestUtils.setField(servicio, "usuariosSaldosClient", null);
    ReflectionTestUtils.setField(servicio, "notificacionSaldoPendienteRepository", mock(NotificacionSaldoPendienteRepository.class));
    assertThrows(RuntimeException.class, () -> servicio.listarNotificaciones());
  }

  @Test void llamadaTecnicaEnviaTenantSinSuplantarActor() {
    var clienteTecnico = new UsuariosSaldosClient();
    var rest = (RestTemplate) ReflectionTestUtils.getField(clienteTecnico, "restTemplate");
    var mockAuth = MockRestServiceServer.bindTo(rest).build();
    RequestContext.set(new RequestContext(2L, null, null, "saldos", 0));
    mockAuth.expect(requestTo("http://localhost:8091/api/usuarios/alumnos/4/apoderados"))
        .andExpect(request -> {
          assertEquals("saldos", request.getHeaders().getFirst("X-Internal-Caller"));
          assertEquals("2", request.getHeaders().getFirst("X-Establecimiento-Id"));
          assertNull(request.getHeaders().getFirst("X-Usuario-Id"));
          assertNull(request.getHeaders().getFirst("X-Rol"));
        }).andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));
    assertEquals(List.of(), clienteTecnico.apoderadosDeAlumno(4L));
    mockAuth.verify();
  }

  @Test void respuestaVaciaValidaSiProvieneDeAuth() {
    when(abonos.findAllByIdEstablecimiento(1L)).thenReturn(List.of());
    servidor.expect(once(), requestTo("http://localhost:8091/api/usuarios/apoderados/3/alumnos"))
        .andRespond(withSuccess("[]", MediaType.APPLICATION_JSON));
    assertEquals(List.of(), servicio.listarAbonos(null, null));
    servidor.verify();
  }
}
