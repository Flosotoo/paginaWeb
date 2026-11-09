package cl.edusaldo.gateway;

import com.fasterxml.jackson.databind.*;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
  private final ObjectMapper json;
  private final GatewayIdentityClient identity;
  private final GatewayAuthorizationPolicy policy;

  @Autowired
  public GatewaySecurityFilter(
      ObjectMapper json, GatewayIdentityClient identity, GatewayAuthorizationPolicy policy) {
    this.json = json;
    this.identity = identity;
    this.policy = policy;
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
    if (!identity.configured()) return error(exchange, HttpStatus.SERVICE_UNAVAILABLE);
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
    Mono<JsonNode> session =
        publicPath ? Mono.just(json.createObjectNode()) : identity.session(bearer);
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
                                  : policy.authorize(path, method, body, who))
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
                        ? HttpStatus.UNAUTHORIZED
                        : error instanceof DataBufferLimitException
                            ? HttpStatus.PAYLOAD_TOO_LARGE
                            : HttpStatus.SERVICE_UNAVAILABLE));
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
    byte[] body =
        ("{\"status\":" + status.value() + ",\"message\":\"Acceso no autorizado\"}")
            .getBytes(StandardCharsets.UTF_8);
    return exchange
        .getResponse()
        .writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
  }
}
