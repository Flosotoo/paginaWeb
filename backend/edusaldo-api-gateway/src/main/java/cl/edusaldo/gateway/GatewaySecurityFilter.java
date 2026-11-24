package cl.edusaldo.gateway;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequestDecorator;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.*;
import reactor.core.publisher.*;

/**
 * Identity and authorization are separate to keep transport rules independent of domain
 * permissions.
 */
@Component
public class GatewaySecurityFilter implements WebFilter, Ordered {
  private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(GatewaySecurityFilter.class);
  private final ObjectMapper json;
  private final GatewayIdentityClient identity;
  private final GatewayAuthorizationPolicy policy;
  private final GatewayJwtVerifier jwtVerifier;

  @Autowired
  public GatewaySecurityFilter(
      ObjectMapper json,
      GatewayIdentityClient identity,
      GatewayAuthorizationPolicy policy,
      GatewayJwtVerifier jwtVerifier) {
    this.json = json;
    this.identity = identity;
    this.policy = policy;
    this.jwtVerifier = jwtVerifier;
  }

  public int getOrder() {
    return -100;
  }

  public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
    String path = exchange.getRequest().getPath().value();
    String method = exchange.getRequest().getMethod().name();
    if (path.equals("/internal")
        || path.contains("/internal/")
        || path.matches("/api/saldos/(retener|liberar|cobrar|reintegrar)(/.*)?")
        || path.matches("/api/inventario/(retener|liberar|descontar|reingresar)(/.*)?"))
      return error(exchange, HttpStatus.FORBIDDEN);
    if (path.equals("/salud")) return chain.filter(exchange);
    if (!identity.configured() || !jwtVerifier.configured())
      return error(exchange, HttpStatus.SERVICE_UNAVAILABLE);
    boolean publicPath =
        method.equals("POST")
            && Set.of(
                    "/api/auth/login",
                    "/api/auth/recuperar-password",
                    "/api/auth/confirmar-recuperacion")
                .contains(path);
    String bearer = exchange.getRequest().getHeaders().getFirst("Authorization");
    if (!publicPath && (bearer == null || !bearer.startsWith("Bearer ")))
      return error(exchange, HttpStatus.UNAUTHORIZED);

    Claims verifiedClaims = null;
    if (!publicPath) {
      verifiedClaims = jwtVerifier.verifyBearer(bearer).orElse(null);
      if (verifiedClaims == null) return error(exchange, HttpStatus.UNAUTHORIZED);
    }

    final Claims claims = verifiedClaims;
    Mono<JsonNode> session =
        publicPath
            ? Mono.just(json.createObjectNode())
            : identity
                .session(bearer)
                .flatMap(
                    who -> {
                      if (!claimsCoincidenConSesion(claims, who)) {
                        return Mono.error(
                            WebClientResponseException.create(
                                HttpStatus.UNAUTHORIZED.value(),
                                "Unauthorized",
                                org.springframework.http.HttpHeaders.EMPTY,
                                new byte[0],
                                StandardCharsets.UTF_8));
                      }
                      return Mono.just(who);
                    });
    return session
        .flatMap(
            who ->
                DataBufferUtils.join(exchange.getRequest().getBody(), 2 * 1024 * 1024)
                    .defaultIfEmpty(exchange.getResponse().bufferFactory().wrap(new byte[0]))
                    .flatMap(
                        buffer -> {
                          byte[] bytes = new byte[buffer.readableByteCount()];
                          buffer.read(bytes);
                          DataBufferUtils.release(buffer);
                          JsonNode body;
                          try {
                            body =
                                bytes.length == 0 ? json.createObjectNode() : json.readTree(bytes);
                            if (body == null) return error(exchange, HttpStatus.BAD_REQUEST);
                          } catch (Exception ex) {
                            return error(exchange, HttpStatus.BAD_REQUEST);
                          }
                          return (publicPath
                                  ? Mono.just(true)
                                  : policy.authorize(path, method, body, who).doOnError(failure -> diagnostico("POLITICA", failure)))
                              .flatMap(
                                  allowed -> {
                                    if (!allowed)
                                      return auditarDenegacion(who, method, path)
                                          .then(error(exchange, HttpStatus.FORBIDDEN));
                                    if (!publicPath)
                                      applyTenant(body, who.path("idEstablecimiento").asLong());
                                    byte[] forwarded;
                                    try {
                                      forwarded =
                                          bytes.length == 0 ? bytes : json.writeValueAsBytes(body);
                                    } catch (Exception ex) {
                                      return error(exchange, HttpStatus.BAD_REQUEST);
                                    }
                                    var uri =
                                        org.springframework.web.util.UriComponentsBuilder.fromUri(
                                            exchange.getRequest().getURI());
                                    if (!publicPath) {
                                      for (String param :
                                          List.of(
                                              "adminId",
                                              "usuarioAdminId",
                                              "encargadoId",
                                              "usuarioId",
                                              "autorizadorId"))
                                        if (exchange
                                            .getRequest()
                                            .getQueryParams()
                                            .containsKey(param))
                                          uri.replaceQueryParam(
                                              param, who.path("usuarioId").asLong());
                                    }
                                    var request =
                                        new ServerHttpRequestDecorator(
                                            exchange
                                                .getRequest()
                                                .mutate()
                                                .uri(uri.build(true).toUri())
                                                .headers(
                                                    h -> {
                                                      identity.trusted(h, who);
                                                      h.remove("Content-Length");
                                                      h.setContentLength(forwarded.length);
                                                    })
                                                .build()) {
                                          @Override
                                          public Flux<DataBuffer> getBody() {
                                            return forwarded.length == 0
                                                ? Flux.empty()
                                                : Flux.defer(
                                                    () ->
                                                        Flux.just(
                                                            exchange
                                                                .getResponse()
                                                                .bufferFactory()
                                                                .wrap(forwarded)));
                                          }
                                        };
                                    return chain.filter(exchange.mutate().request(request).build())
                                        .doOnError(failure -> diagnostico("REENVIO", failure))
                                        .doOnSuccess(ignored -> LOG.debug("Gateway: reenvio finalizado, estado={}", exchange.getResponse().getStatusCode()))
                                        .then(Mono.defer(() -> !publicPath
                                                && exchange.getResponse().getStatusCode() == HttpStatus.FORBIDDEN
                                            ? auditarDenegacion(who, method, path) : Mono.empty()));
                                  });
                        }))
        .onErrorResume(
            error ->
                error(
                    exchange,
                    error instanceof WebClientResponseException response
                            && response.getStatusCode().is4xxClientError()
                        ? (esFalloConfianzaInterna(response)
                            ? HttpStatus.BAD_GATEWAY
                            : HttpStatus.UNAUTHORIZED)
                        : error instanceof DataBufferLimitException
                            ? HttpStatus.PAYLOAD_TOO_LARGE
                            : HttpStatus.SERVICE_UNAVAILABLE));
  }

  private static boolean esFalloConfianzaInterna(WebClientResponseException response) {
    String body = response.getResponseBodyAsString();
    return body != null && body.contains("Acceso interno no autorizado");
  }

  private boolean claimsCoincidenConSesion(Claims claims, JsonNode who) {
    if (claims == null || who == null) return false;
    long claimSub = Long.parseLong(claims.getSubject());
    long claimTenant = claims.get("tenant", Number.class).longValue();
    String claimRol = claims.get("rol", String.class);
    return who.path("usuarioId").asLong(-1) == claimSub
        && who.path("idEstablecimiento").asLong(-1) == claimTenant
        && Objects.equals(claimRol, who.path("rol").asText());
  }

  private void diagnostico(String etapa, Throwable failure) {
    LOG.warn("Gateway: etapa={}, tipo={}, estadoHTTP={}", etapa,
        failure.getClass().getSimpleName(),
        failure instanceof WebClientResponseException response
            ? response.getStatusCode().value() : "N/A");
  }

  private void applyTenant(JsonNode body, long tenant) {
    if (body.isArray()) body.forEach(row -> applyTenant(row, tenant));
    else if (body instanceof ObjectNode object) object.put("idEstablecimiento", tenant);
  }

  private Mono<Void> auditarDenegacion(JsonNode who, String method, String path) {
    return identity.auditarDenegacion(who, method, path).onErrorResume(failure -> {
      org.slf4j.LoggerFactory.getLogger(GatewaySecurityFilter.class)
          .warn("No fue posible registrar un acceso denegado");
      return Mono.empty();
    });
  }

  private Mono<Void> error(ServerWebExchange exchange, HttpStatus status) {
    exchange.getResponse().setStatusCode(status);
    exchange.getResponse().getHeaders().set("Content-Type", "application/json");
    String message =
        status == HttpStatus.BAD_GATEWAY
            ? "Error de confianza interna entre servicios"
            : status == HttpStatus.SERVICE_UNAVAILABLE
                ? "Servicio temporalmente no disponible"
                : status == HttpStatus.BAD_REQUEST
                    ? "Solicitud inválida"
                    : status == HttpStatus.PAYLOAD_TOO_LARGE
                        ? "Cuerpo de solicitud excede el límite permitido"
                        : "Acceso no autorizado";
    byte[] body =
        ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}")
            .getBytes(StandardCharsets.UTF_8);
    return exchange
        .getResponse()
        .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
  }
}
