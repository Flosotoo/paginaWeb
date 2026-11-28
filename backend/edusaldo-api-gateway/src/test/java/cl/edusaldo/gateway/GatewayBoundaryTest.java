package cl.edusaldo.gateway;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.http.*;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;

class GatewayBoundaryTest {
  private static final String JWT_SECRET = "clave-secreta-jwt-gateway-test-32-bytes-minimo";

  private final ObjectMapper json = new ObjectMapper();
  private final GatewayIdentityClient identity =
      new GatewayIdentityClient("01234567890123456789012345678901", "http://localhost:8091");
  private final GatewayJwtVerifier jwtVerifier =
      new GatewayJwtVerifier(JWT_SECRET, "edusaldo-auth");

  private String bearerFor(long userId, long tenant, String role) {
    Instant now = Instant.now();
    String token =
        Jwts.builder()
            .header()
            .type("JWT")
            .and()
            .issuer("edusaldo-auth")
            .subject(String.valueOf(userId))
            .id(UUID.randomUUID().toString())
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))
            .claim("tenant", tenant)
            .claim("rol", role)
            .signWith(
                Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
            .compact();
    return "Bearer " + token;
  }

  private GatewaySecurityFilter filter(GatewayIdentityClient client) {
    if (mockingDetails(client).isSpy())
      doReturn(Mono.empty()).when(client).auditarDenegacion(any(), anyString(), anyString());
    return new GatewaySecurityFilter(
        json, client, new GatewayAuthorizationPolicy(client), jwtVerifier);
  }

  @Test
  void accesoDenegadoSeAuditaSinEnviarConsultaNiCuerpo() throws Exception {
    var client = spy(identity);
    var bearer = bearerFor(3, 1, "APODERADO");
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    doReturn(Mono.just(who)).when(client).session(bearer);
    doReturn(Mono.empty()).when(client).auditarDenegacion(who, "GET", "/api/auditoria");
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/auditoria?dato=secreto").header("Authorization", bearer));
    filter(client).filter(ex, e -> { throw new AssertionError("No debe enrutar"); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    verify(client).auditarDenegacion(who, "GET", "/api/auditoria");
  }

  @Test
  void falloDeAuditoriaNoAutorizaLaPeticion() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var bearer = bearerFor(3, 1, "APODERADO");
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    when(client.configured()).thenReturn(true);
    when(client.session(bearer)).thenReturn(Mono.just(who));
    when(client.auditarDenegacion(who, "GET", "/api/auditoria"))
        .thenReturn(Mono.error(new IllegalStateException("Auditoría no disponible")));
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/auditoria").header("Authorization", bearer));
    filter(client).filter(ex, e -> { throw new AssertionError("No debe enrutar"); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
  }

  @Test
  void registraDenegacionDevueltaPorServicio() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var bearer = bearerFor(3, 1, "APODERADO");
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\"}");
    when(client.configured()).thenReturn(true);
    when(client.session(bearer)).thenReturn(Mono.just(who));
    when(client.auditarDenegacion(who, "GET", "/api/productos")).thenReturn(Mono.empty());
    var ex = MockServerWebExchange.from(MockServerHttpRequest.get("/api/productos").header("Authorization", bearer));
    filter(client).filter(ex, e -> { e.getResponse().setStatusCode(HttpStatus.FORBIDDEN); return Mono.empty(); }).block();
    assertEquals(HttpStatus.FORBIDDEN, ex.getResponse().getStatusCode());
    verify(client).auditarDenegacion(who, "GET", "/api/productos");
  }

  @Test
  void gatewayRechazaJwtAdulteradoAlgNoneYExpiradoSinConsultarAuth() {
    var client = mock(GatewayIdentityClient.class);
    when(client.configured()).thenReturn(true);

    String valido = bearerFor(3, 1, "APODERADO").substring(7);
    String[] partes = valido.split("\\.");

    // 1. Payload adulterado (elevación de rol).
    String payloadFalso =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(
                "{\"iss\":\"edusaldo-auth\",\"sub\":\"3\",\"jti\":\"x\",\"tenant\":1,\"rol\":\"ADMINISTRADOR\"}"
                    .getBytes(StandardCharsets.UTF_8));
    String adulterado = "Bearer " + partes[0] + "." + payloadFalso + "." + partes[2];

    // 2. alg: none sin firma.
    String headerNone =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    String sinFirma = "Bearer " + headerNone + "." + partes[1] + ".";

    // 3. Token expirado.
    Instant pasado = Instant.now().minusSeconds(600);
    String expirado =
        "Bearer "
            + Jwts.builder()
                .issuer("edusaldo-auth")
                .subject("3")
                .id(UUID.randomUUID().toString())
                .issuedAt(Date.from(pasado.minusSeconds(3600)))
                .expiration(Date.from(pasado))
                .claim("tenant", 1L)
                .claim("rol", "APODERADO")
                .signWith(
                    Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256)
                .compact();

    for (String tokenInvalido : new String[] {adulterado, sinFirma, expirado, "Bearer no-es-jwt"}) {
      var ex =
          MockServerWebExchange.from(
              MockServerHttpRequest.get("/api/productos").header("Authorization", tokenInvalido));
      filter(client)
          .filter(
              ex,
              e -> {
                throw new AssertionError("No debe enrutar token inválido");
              })
          .block();
      assertEquals(HttpStatus.UNAUTHORIZED, ex.getResponse().getStatusCode());
    }
    verify(client, never()).session(anyString());
  }

  @Test
  void cambioDeClaveAceptaRutConFormatoYSinGuionPeroNoOtraIdentidad() throws Exception {
    var policy = new GatewayAuthorizationPolicy(identity);
    var who = json.readTree("{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"rut\":\"12345678-5\",\"correo\":\"persona@example.org\"}");
    assertTrue(policy.authorize("/api/auth/cambiar-password", "POST", json.readTree("{\"identificador\":\"12.345.678-5\"}"), who).block());
    assertTrue(policy.authorize("/api/auth/cambiar-password", "POST", json.readTree("{\"identificador\":\"123456785\"}"), who).block());
    assertFalse(policy.authorize("/api/auth/cambiar-password", "POST", json.readTree("{\"identificador\":\"12345678-9\"}"), who).block());
  }

  @Test
  void personalYApoderadosPuedenConsultarAlertasYElApoderadoSusAbonos() throws Exception {
    var policy = new GatewayAuthorizationPolicy(identity);
    for (String role : new String[] {"ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO"}) {
      var who =
          json.readTree(
              "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\""
                  + role
                  + "\",\"estado\":\"ACTIVA\"}");
      assertEquals(
          !role.equals("ALUMNO"),
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
  void alumnoTienePermisosLimitadosYSoloSobreSusRecursos() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var policy = new GatewayAuthorizationPolicy(client);
    var who = json.readTree("{\"usuarioId\":4,\"idEstablecimiento\":1,\"rol\":\"ALUMNO\",\"estado\":\"ACTIVA\",\"alumnos\":[5]}");
    var empty = json.createObjectNode();
    when(client.read("/api/usuarios/4", who)).thenReturn(Mono.just(json.readTree("{\"id\":4,\"idEstablecimiento\":1}")));
    when(client.read("/api/usuarios/5", who)).thenReturn(Mono.just(json.readTree("{\"id\":5,\"idEstablecimiento\":1}")));
    when(client.read("/api/reservas/7", who)).thenReturn(Mono.just(json.readTree("{\"alumnoId\":4,\"idEstablecimiento\":1}")));
    when(client.read("/api/reservas/8", who)).thenReturn(Mono.just(json.readTree("{\"alumnoId\":5,\"idEstablecimiento\":1}")));
    for (String path : new String[] {"/api/productos", "/api/categorias", "/api/saldos/cuenta/4", "/api/reservas/alumno/4", "/api/reservas/7"})
      assertTrue(policy.authorize(path, "GET", empty, who).block(), path);
    for (String path : new String[] {"/api/saldos/cuenta/4/movimientos", "/api/saldos/cuenta/5", "/api/reservas/alumno/5", "/api/reservas/8", "/api/reservas", "/api/reservas/notificaciones", "/api/saldos/notificaciones", "/api/saldos/abonos", "/api/entregas", "/api/devoluciones", "/api/usuarios/solicitudes-correccion"})
      assertFalse(policy.authorize(path, "GET", empty, who).block(), path);
    assertTrue(policy.authorize("/api/reservas", "POST", json.readTree("{\"alumnoId\":4}"), who).block());
    assertFalse(policy.authorize("/api/reservas", "POST", json.readTree("{\"alumnoId\":5}"), who).block());
    assertTrue(policy.authorize("/api/reservas/7/cancelar", "POST", empty, who).block());
    assertFalse(policy.authorize("/api/reservas/8/cancelar", "POST", empty, who).block());
    for (String path : new String[] {"/api/saldos/abonos/iniciar", "/api/saldos/abonos/confirmar", "/api/reservas/7/marcar-lista", "/api/reservas/7/entregar", "/api/usuarios/solicitudes-correccion"})
      assertFalse(policy.authorize(path, "POST", empty, who).block(), path);
  }

  @Test
  void dependenciaCaidaNoSeConfundeConDenegacion() throws Exception {
    var client = spy(identity);
    var bearer = bearerFor(3, 1, "APODERADO");
    var who =
        json.readTree(
            "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
    doReturn(Mono.just(who)).when(client).session(bearer);
    doReturn(Mono.error(new IllegalStateException("Servicio caído")))
        .when(client)
        .read("/api/usuarios/4", who);
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/saldos/cuenta/4")
                .header("Authorization", bearer));
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
    var bearer = bearerFor(3, 1, "APODERADO");
    var who =
        json.readTree(
            "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
    doReturn(Mono.just(who)).when(client).session(bearer);
    doReturn(Mono.just(json.readTree("{\"id\":4,\"idEstablecimiento\":2}")))
        .when(client)
        .read("/api/usuarios/4", who);
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/saldos/cuenta/4")
                .header("Authorization", bearer));
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
      var bearer = bearerFor(3, 1, "APODERADO");
      var who =
          json.readTree(
              "{\"usuarioId\":3,\"idEstablecimiento\":1,\"rol\":\"APODERADO\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
      doReturn(Mono.just(who)).when(client).session(bearer);
      var failure =
          org.springframework.web.reactive.function.client.WebClientResponseException.create(
              status, "error", HttpHeaders.EMPTY, null, null);
      doReturn(Mono.error(failure)).when(client).read("/api/usuarios/4", who);
      var ex =
          MockServerWebExchange.from(
              MockServerHttpRequest.get("/api/saldos/cuenta/4")
                  .header("Authorization", bearer));
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
    var bearer = bearerFor(7, 2, "ADMINISTRADOR");
    var who =
        json.readTree(
            "{\"usuarioId\":7,\"idEstablecimiento\":2,\"rol\":\"ADMINISTRADOR\",\"estado\":\"ACTIVA\",\"umbralSaldoBajoClp\":4500}");
    doReturn(Mono.just(who)).when(client).session(bearer);
    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/configuracion")
                .header("Authorization", bearer)
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

  @Test
  void peticionSinTokenOMalformadaDevuelve401SinConsultarAuth() {
    var client = mock(GatewayIdentityClient.class);
    when(client.configured()).thenReturn(true);

    var sinHeader = MockServerWebExchange.from(MockServerHttpRequest.get("/api/productos"));
    var bearerVacio =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/productos").header("Authorization", "Bearer "));
    var esquemaBasic =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/productos").header("Authorization", "Basic dXNlcjpwYXNz"));

    for (var ex : new MockServerWebExchange[] {sinHeader, bearerVacio, esquemaBasic}) {
      filter(client)
          .filter(
              ex,
              e -> {
                throw new AssertionError("No debe enrutar sin token válido");
              })
          .block();
      assertEquals(HttpStatus.UNAUTHORIZED, ex.getResponse().getStatusCode());
    }
    verify(client, never()).session(anyString());
  }

  @Test
  void tokenConFirmaValidaPeroRevocadoEnAuthDevuelve401() {
    var client = mock(GatewayIdentityClient.class);
    when(client.configured()).thenReturn(true);
    var bearer = bearerFor(3, 1, "APODERADO");
    var unauthorized =
        org.springframework.web.reactive.function.client.WebClientResponseException.create(
            401, "Unauthorized", HttpHeaders.EMPTY, new byte[0], StandardCharsets.UTF_8);
    when(client.session(bearer)).thenReturn(Mono.error(unauthorized));

    var ex =
        MockServerWebExchange.from(
            MockServerHttpRequest.get("/api/productos").header("Authorization", bearer));
    filter(client)
        .filter(
            ex,
            e -> {
              throw new AssertionError("No debe enrutar token revocado");
            })
        .block();
    assertEquals(HttpStatus.UNAUTHORIZED, ex.getResponse().getStatusCode());
    verify(client).session(bearer);
  }

  @Test
  void matrizDePermisosCuatroPerfilesEnComprasEntregasYOperaciones() throws Exception {
    var client = mock(GatewayIdentityClient.class);
    var policy = new GatewayAuthorizationPolicy(client);
    var empty = json.createObjectNode();

    for (String role : new String[] {"ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO"}) {
      var who =
          json.readTree(
              "{\"usuarioId\":10,\"idEstablecimiento\":1,\"rol\":\""
                  + role
                  + "\",\"estado\":\"ACTIVA\",\"alumnos\":[4]}");
      boolean esStaff = role.equals("ADMINISTRADOR") || role.equals("ENCARGADO");
      boolean esAdmin = role.equals("ADMINISTRADOR");

      // Listados globales operativos: solo personal (ADMIN / ENCARGADO).
      for (String globalPath :
          new String[] {
            "/api/entregas/historial",
            "/api/entregas/dia",
            "/api/devoluciones",
            "/api/reservas",
            "/api/operaciones",
            "/api/proveedores",
            "/api/ordenes-compra"
          }) {
        assertEquals(
            esStaff,
            policy.authorize(globalPath, "GET", empty, who).block(),
            role + " GET " + globalPath);
      }

      // Acciones operativas de compras y mesón.
      assertEquals(
          esStaff,
          policy.authorize("/api/ordenes-compra", "POST", empty, who).block(),
          role + " POST /api/ordenes-compra");
      assertEquals(
          esStaff,
          policy.authorize("/api/ordenes-compra/1/recepcionar", "PATCH", empty, who).block(),
          role + " PATCH /api/ordenes-compra/1/recepcionar");
      assertEquals(
          esAdmin,
          policy.authorize("/api/ordenes-compra/1/aprobar", "PATCH", empty, who).block(),
          role + " PATCH /api/ordenes-compra/1/aprobar");
      assertEquals(
          esAdmin,
          policy.authorize("/api/proveedores", "POST", empty, who).block(),
          role + " POST /api/proveedores");
      assertEquals(
          esStaff,
          policy.authorize("/api/entregas/meson", "POST", empty, who).block(),
          role + " POST /api/entregas/meson");
      assertEquals(
          esAdmin,
          policy.authorize("/api/inventario/valorizacion", "GET", empty, who).block(),
          role + " GET /api/inventario/valorizacion");
      assertEquals(
          esAdmin,
          policy.authorize("/api/inventario/costos-ventas", "GET", empty, who).block(),
          role + " GET /api/inventario/costos-ventas");
    }
  }
}
