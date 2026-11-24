package cl.edusaldo.gateway;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
public class GatewayHealthController {
  private final GatewayIdentityClient identity;
  private final GatewayJwtVerifier jwtVerifier;

  public GatewayHealthController(GatewayIdentityClient identity, GatewayJwtVerifier jwtVerifier) {
    this.identity = identity;
    this.jwtVerifier = jwtVerifier;
  }

  @GetMapping("/salud")
  public Mono<ResponseEntity<Map<String, String>>> salud() {
    if (!jwtVerifier.configured()) {
      return Mono.just(ResponseEntity.status(503).body(Map.of("status", "DOWN")));
    }
    return identity
        .ready()
        .map(
            ready ->
                ResponseEntity.status(ready ? 200 : 503)
                    .body(Map.of("status", ready ? "UP" : "DOWN")));
  }
}
