package cl.edusaldo.gateway;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@RestController
public class GatewayHealthController {
  private final GatewayIdentityClient identity;

  public GatewayHealthController(GatewayIdentityClient identity) {
    this.identity = identity;
  }

  @GetMapping("/salud")
  public Mono<ResponseEntity<Map<String, String>>> salud() {
    return identity
        .ready()
        .map(
            ready ->
                ResponseEntity.status(ready ? 200 : 503)
                    .body(Map.of("status", ready ? "UP" : "DOWN")));
  }
}
