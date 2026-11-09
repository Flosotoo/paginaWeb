package cl.edusaldo.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/** Lookups need the same verified tenant so authorization cannot inspect a different school. */
@Component
public class GatewayIdentityClient {
  private final WebClient http = WebClient.create();
  private final String key;
  private final String authUrl;

  public GatewayIdentityClient(
      @Value("${EDUSALDO_INTERNAL_KEY:}") String key,
      @Value("${edusaldo.auth-url:http://localhost:8091}") String authUrl) {
    this.key = key;
    this.authUrl = authUrl;
  }

  public boolean configured() {
    return key.length() >= 32;
  }

  public Mono<JsonNode> session(String bearer) {
    return http.get()
        .uri(authUrl + "/internal/sesiones/validar")
        .header("X-Internal-Key", key)
        .header("X-Internal-Caller", "gateway")
        .header(HttpHeaders.AUTHORIZATION, bearer)
        .retrieve()
        .bodyToMono(JsonNode.class)
        .timeout(Duration.ofSeconds(3));
  }

  public Mono<Boolean> ready() {
    if (!configured()) return Mono.just(false);
    return http.get()
        .uri(authUrl + "/internal/salud")
        .header("X-Internal-Key", key)
        .retrieve()
        .bodyToMono(JsonNode.class)
        .map(body -> "UP".equals(body.path("status").asText()))
        .timeout(Duration.ofSeconds(3))
        .onErrorReturn(false);
  }

  public Mono<JsonNode> read(String path, JsonNode who) {
    return http.get()
        .uri(base(path) + path)
        .headers(headers -> trusted(headers, who))
        .retrieve()
        .bodyToMono(JsonNode.class)
        .timeout(Duration.ofSeconds(3));
  }

  public Mono<Void> auditarDenegacion(JsonNode who, String method, String path) {
    String[] partes = path.split("/");
    String recurso = partes.length > 2 && java.util.Set.of(
        "auth", "usuarios", "saldos", "productos", "categorias", "inventario",
        "reservas", "entregas", "devoluciones", "auditoria", "configuracion",
        "politica-acceso", "parametros", "operaciones", "consentimientos")
        .contains(partes[2]) ? partes[2] : "otros";
    return http.post().uri(authUrl + "/internal/auditoria/denegacion")
        .headers(headers -> trusted(headers, who))
        .bodyValue(java.util.Map.of("metodo", method, "recurso", recurso))
        .retrieve().toBodilessEntity().timeout(Duration.ofSeconds(3)).then();
  }

  private String base(String path) {
    if (path.startsWith("/api/saldos")) return "http://localhost:8092";
    if (path.matches("/api/(productos|categorias|inventario)(/.*)?"))
      return "http://localhost:8093";
    if (path.matches("/api/(reservas|entregas|devoluciones|operaciones)(/.*)?"))
      return "http://localhost:8094";
    return authUrl;
  }

  public void trusted(HttpHeaders headers, JsonNode who) {
    // Stripping all client X headers also covers future additions to the trust contract.
    new java.util.ArrayList<>(headers.keySet())
        .stream().filter(name -> name.regionMatches(true, 0, "X-", 0, 2)).forEach(headers::remove);
    headers.set("X-Internal-Key", key);
    headers.set("X-Internal-Caller", "gateway");
    if (who.hasNonNull("usuarioId")) {
      headers.set("X-Usuario-Id", who.path("usuarioId").asText());
      headers.set("X-Establecimiento-Id", who.path("idEstablecimiento").asText());
      headers.set("X-Rol", who.path("rol").asText());
      headers.set("X-Umbral-Saldo-Bajo", who.path("umbralSaldoBajoClp").asText("3000"));
    }
  }
}
