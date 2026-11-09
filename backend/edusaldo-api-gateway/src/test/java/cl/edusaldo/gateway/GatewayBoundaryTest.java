package cl.edusaldo.gateway;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

class GatewayBoundaryTest {
  private final ObjectMapper json = new ObjectMapper();
  private final GatewayIdentityClient identity =
      new GatewayIdentityClient("01234567890123456789012345678901", "http://localhost:8091");

  private GatewaySecurityFilter filter(GatewayIdentityClient client) {
    if (mockingDetails(client).isSpy())
      doReturn(Mono.empty()).when(client).auditarDenegacion(any(), anyString(), anyString());
    return new GatewaySecurityFilter(json, client, new GatewayAuthorizationPolicy(client));
  }

  @Test
  void accesoDenegadoSeAuditaSinEnviarConsultaNiCuerpo() throws Exception {
    var client = spy(identity);
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    doReturn(Mono.just(who)).when(client).session("Bearer valido");
    doReturn(Mono.empty()).when(client).auditarDenegacion(who, "GET", "/api/auditoria");
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/auditoria?dato=secreto").header("Authorization", "Bearer valido"));
    filter(client).filter(ex, e -> { throw new AssertionError("No debe enrutar"); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    verify(client).auditarDenegacion(who, "GET", "/api/auditoria");
  }

  @Test
  void falloDeAuditoriaNoAutorizaLaPeticion() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    when(client.configured()).thenReturn(true);
    when(client.session("Bearer valido")).thenReturn(Mono.just(who));
    when(client.auditarDenegacion(who, "GET", "/api/auditoria"))
        .thenReturn(Mono.error(new IllegalStateException("Auditoría no disponible")));
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/auditoria").header("Authorization", "Bearer valido"));
    filter(client).filter(ex, e -> { throw new AssertionError("No debe enrutar"); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
  }

  @Test
  void registraDenegacionDevueltaPorServicio() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    when(client.configured()).thenReturn(true);
    when(client.session("Bearer valido")).thenReturn(Mono.just(who));
    when(client.auditarDenegacion(who, "GET", "/api/productos")) .thenReturn(Mono.empty());
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/productos").header("Authorization", "Bearer valido"));
    filter(client).filter(ex, e -> { e.getResponse().setStatusCode(HttpStatus.FORBIDDEN); return Mono.empty(); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    verify(client).auditarDenegacion(who, "GET", "/api/productos");
  }

  @Test
  void cambioDeClaveAceptaRutConFormatoPeroNoOtraIdentidad() throws Exception {
    var policy = new GatewayAuthorizationPolicy(identity);
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"rut\":\"12345678-5\",\"correo\":\"persona@example.org\"}");
    assertTrue(policy.authorize("/api/auth/cambiar-password", "POST", json.readTree("{\"identificador\":\"12.345.678-5\"}"), who).block());
    assertFalse(policy.authorize("/api/auth/cambiar-password", "POST", json.readTree("{\"identificador\":\"12345678-9\"}"), who).block());
  }

  @Test
  void titularesPuedenConsultarSusAlertasYElApoderadoSusAbonos() throws Exception {
    var policy = new GatewayAuthorizationPolicy(identity);
    for (String role : new String[] {"ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO"}) {
      var who =
          json.readTree(
              "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\""
                  + role
                  + "\",\"estado\":\"ACTIVA\"}");
      assertTrue(
          policy
              .authorize("/api/saldos/notificaciones", "GET", json.createObjectNode(), who)
              .block());
      assertEquals(
          java.util.Set.of("ADMINISTRADOR", "APODERADO").contains(role),
          policy.authorize("/api/saldos/abonos", "GET", json.createObjectNode(), who).block());
      assertEquals(
          role.equals("ADMINISTRADOR"),
          policy.authorize("/api/productos", "POST", json.createObjectNode(), who).block());
      assertEquals(
          role.equals("ADMINISTRADOR"),
          policy.authorize("/api/categorias", "POST", json.createObjectNode(), who).block());
    }
  }

  @Test
  void dependenciaCaidaNoSeConfundeConDenegacion() throws Exception {
    var client = spy(identity);
    var who =
        json.readTree(
            "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
    doReturn(Mono.just(who)).when(client).session("Bearer valido");
    doReturn(Mono.error(new IllegalStateException("Servicio caído")))
        .when(client)
        .read("/api/usuarios/4", who);
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/saldos/cuenta/4")
                .header("Authorization", "Bearer valido"));
    filter(client)
        .filter(
            ex,
            e -> {
              throw new AssertionError("No debe enrutar sin dependencia");
            })
        .block();
    assertEquals(HttpStatus.SERVICE_UNAVAILABLE, ex.getResponse().getStatusCode());
  }

  @Test
  void alumnoDeOtroColegioSeRechazaAunqueLaDependenciaResponda() throws Exception {
    var client = spy(identity);
    var who =
        json.readTree(
            "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
    doReturn(Mono.just(who)).when(client).session("Bearer valido");
    doReturn(Mono.just(json.readTree("{\"id\":4,\"idEstablecimiento\":2}")))
        .when(client)
        .read("/api/usuarios/4", who);
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/saldos/cuenta/4")
                .header("Authorization", "Bearer valido"));
    filter(client)
        .filter(
            ex,
            e -> {
              throw new AssertionError("No debe enrutar recurso ajeno");
            })
        .block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
  }

  @Test
  void errorDeRecursoAusenteSeDistingueDeErrorDelServicio() throws Exception {
    for (int status : new int[] {404, 503}) {
      var client = spy(identity);
      var who =
          json.readTree(
              "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
      doReturn(Mono.just(who)).when(client).session("Bearer valido");
      var failure =
          org.springframework.web.reactive.function.client.WebClientResponseException.create(
              status, "error", HttpHeaders.EMPTY, null, null);
      doReturn(Mono.error(failure)).when(client).read("/api/usuarios/4", who);
      var ex =
          MockServerWebExchange.from(
              MockServerHttpRequest.get("/api/saldos/cuenta/4")
                  .header("Authorization", "Bearer valido"));
      filter(client)
          .filter(
              ex,
              e -> {
                throw new AssertionError("No debe enrutar");
              })
          .block();
      assertEquals(
          status == 404 ? HttpStatus.FORBIDDEN : HttpStatus.SERVICE_UNAVAILABLE,
          ex.getResponse().getStatusCode());
    }
  }

  @Test
  void rutasTecnicasSeRechazanAntesDeConsultarSesion() {
    for (String path :
        new String[] {
          "/api/saldos/retener",
          "/api/saldos/liberar",
          "/api/saldos/cobrar",
          "/api/saldos/reintegrar",
          "/api/inventario/retener",
          "/api/inventario/liberar",
          "/api/inventario/descontar",
          "/api/inventario/reingresar",
          "/internal/salud",
          "/api/saldos/internal/abonos/token/propietario"
        }) {
      var ex = MockServerWebExchange.from(MockServerHttpRequest.post(path));
      filter(identity)
          .filter(
              ex,
              e -> {
                throw new AssertionError("No debe enrutar operación técnica");
              })
          .block();
      assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode(), path);
    }
  }

  @Test
  void corsResuelvePreflightSinAutenticacionNiCookies() {
    var cors =
        new GatewayCorsConfiguration().corsWebFilter("http://localhost:5173,http://localhost:4173");
    var client =
        org.springframework.test.web.reactive.server.WebTestClient.bindToWebHandler(
                exchange ->
                    Mono.error(
                        new AssertionError("El preflight debe resolverse antes de identidad")))
            .webFilter(cors)
            .build();
    client
        .options()
        .uri("http://localhost:8090/api/auth/login")
        .header("Origin", "http://localhost:5173")
        .header("Access-Control-Request-Method", "POST")
        .header("Access-Control-Request-Headers", "Authorization,Content-Type")
        .exchange()
        .expectStatus()
        .isOk()
        .expectHeader()
        .valueEquals("Access-Control-Allow-Origin", "http://localhost:5173")
        .expectHeader()
        .doesNotExist("Access-Control-Allow-Credentials");
  }

  @Test
  void corsRechazaOrigenAjenoYConservaCabeceraEnError401() {
    var cors = new GatewayCorsConfiguration().corsWebFilter("http://localhost:5173");
    var ajeno =
        MockServerWebExchange.from(
            MockServerHttpRequest.options("http://localhost:8090/api/auth/login")
                .header("Origin", "https://ajeno.cl")
                .header("Access-Control-Request-Method", "POST"));
    cors.filter(ajeno, e -> Mono.empty()).block();
    assertEquals(HttpStatus.FORBIDDEN, ajeno.getResponse().getStatusCode());
    assertNull(ajeno.getResponse().getHeaders().getAccessControlAllowOrigin());
    var valido =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("http://localhost:8090/api/usuarios")
                .header("Origin", "http://localhost:5173"));
    cors.filter(valido, e -> filter(identity).filter(e, next -> Mono.empty())).block();
    assertEquals(HttpStatus.UNAUTHORIZED, valido.getResponse().getStatusCode());
    assertEquals(
        "http://localhost:5173", valido.getResponse().getHeaders().getAccessControlAllowOrigin());
  }

  @Test
  void cabecerasDeActorSeSustituyenPorLaSesionPersistida() throws Exception {
    var client = spy(identity);
    var who =
        json.readTree(
            "{\"usuarioId\":7,\"idEstablecimiento\":2,\"rol\":\"ADMINISTRADOR\",\"estado\":\"ACTIVA\",\"umbralSaldoBajoClp\":4500}");
    doReturn(Mono.just(who)).when(client).session("Bearer valido");
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/configuracion")
                .header("Authorization", "Bearer valido")
                .header("X-Usuario-Id", "1")
                .header("X-Establecimiento-Id", "99")
                .header("X-Rol", "ENCARGADO")
                .header("X-Internal-Key", "falso")
                .header("X-Otro-Contexto", "falso"));
    var routed = new AtomicBoolean();
    filter(client)
        .filter(
            ex,
            next -> {
              routed.set(true);
              var h = next.getRequest().getHeaders();
              assertEquals("7", h.getFirst("X-Usuario-Id"));
              assertEquals("2", h.getFirst("X-Establecimiento-Id"));
              assertEquals("ADMINISTRADOR", h.getFirst("X-Rol"));
              assertEquals("4500", h.getFirst("X-Umbral-Saldo-Bajo"));
              assertEquals("gateway", h.getFirst("X-Internal-Caller"));
              assertEquals("01234567890123456789012345678901", h.getFirst("X-Internal-Key"));
              assertNull(h.getFirst("X-Otro-Contexto"));
              return Mono.empty();
            })
        .block();
    assertTrue(routed.get());
  }

  @Test
  void importacionRechazaTenantAjenoEnCualquierFila() throws Exception {
    var who =
        json.readTree(
            "{\"usuarioId\":7,\"idEstablecimiento\":2,\"rol\":\"ADMINISTRADOR\",\"estado\":\"ACTIVA\"}");
    var rows = json.readTree("[{\"idEstablecimiento\":2},{\"idEstablecimiento\":99}]");
    assertFalse(
        new GatewayAuthorizationPolicy(identity)
            .authorize("/api/usuarios/alumnos/importacion-masiva", "POST", rows, who)
            .block());
  }

  @Test
  void consentimientoPropioSePermiteParaLosCuatroRolesYNoParaOtroUsuario() throws Exception {
    for (String role : new String[] {"ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO"}) {
      var who =
          json.readTree(
              "{\"usuarioId\":7,\"idEstablecimiento\":2,\"rol\":\""
                  + role
                  + "\",\"estado\":\"ACTIVA\"}");
      var policy = new GatewayAuthorizationPolicy(identity);
      assertTrue(
          policy
              .authorize("/api/consentimiento", "POST", json.readTree("{\"usuarioId\":7}"), who)
              .block());
      assertFalse(
          policy
              .authorize("/api/consentimiento", "POST", json.readTree("{\"usuarioId\":8}"), who)
              .block());
    }
  }

  @Test
  void primerAccesoRechazaOperacionesYPermiteConsultarSesion() throws Exception {
    var who =
        json.readTree(
            "{\"usuarioId\":7,\"idEstablecimiento\":2,\"rol\":\"ADMINISTRADOR\",\"estado\":\"PRIMER_ACCESO\"}");
    var policy = new GatewayAuthorizationPolicy(identity);
    assertFalse(policy.authorize("/api/operaciones", "GET", json.createObjectNode(), who).block());
    assertTrue(policy.authorize("/api/auth/sesion", "GET", json.createObjectNode(), who).block());
  }
}
