package cl.edusaldo.gateway;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.Set;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Verifica criptográficamente el JWT HS256 en el borde antes de consultar estado de sesión. */
@Component
public class GatewayJwtVerifier {
  private static final int MIN_SECRET_BYTES = 32;
  private static final Set<String> ROLES_VALIDOS =
      Set.of("ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO");

  private final String secret;
  private final String issuer;

  public GatewayJwtVerifier(
      @Value("${edusaldo.jwt.secret:${EDUSALDO_JWT_SECRET:}}") String secret,
      @Value("${edusaldo.jwt.issuer:edusaldo-auth}") String issuer) {
    this.secret = secret == null ? "" : secret.trim();
    this.issuer = issuer == null || issuer.isBlank() ? "edusaldo-auth" : issuer.trim();
  }

  @PostConstruct
  void validarConfiguracion() {
    if (!configured()) {
      throw new IllegalStateException(
          "Configuración inválida: edusaldo.jwt.secret (EDUSALDO_JWT_SECRET) debe tener al menos 32 bytes.");
    }
  }

  public boolean configured() {
    return secret.getBytes(StandardCharsets.UTF_8).length >= MIN_SECRET_BYTES;
  }

  private SecretKey key() {
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public Optional<Claims> verifyBearer(String bearerHeader) {
    if (!configured() || bearerHeader == null || !bearerHeader.startsWith("Bearer ")) {
      return Optional.empty();
    }
    String token = bearerHeader.substring(7).trim();
    if (token.isEmpty()) {
      return Optional.empty();
    }
    try {
      Claims claims =
          Jwts.parser()
              .verifyWith(key())
              .requireIssuer(issuer)
              .build()
              .parseSignedClaims(token)
              .getPayload();
      String sub = claims.getSubject();
      String jti = claims.getId();
      String rol = claims.get("rol", String.class);
      Number tenant = claims.get("tenant", Number.class);
      if (sub == null
          || sub.isBlank()
          || jti == null
          || jti.isBlank()
          || rol == null
          || !ROLES_VALIDOS.contains(rol)
          || tenant == null
          || tenant.longValue() <= 0) {
        return Optional.empty();
      }
      Long.parseLong(sub);
      return Optional.of(claims);
    } catch (JwtException | IllegalArgumentException ex) {
      return Optional.empty();
    }
  }
}
