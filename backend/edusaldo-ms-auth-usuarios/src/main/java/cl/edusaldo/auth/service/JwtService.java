package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Firma y verifica JWT HS256 con secreto externo; falla cerrado si la clave no es segura. */
@Service
public class JwtService {
  private static final int MIN_SECRET_BYTES = 32;

  private final String secret;
  private final long expirationSeconds;
  private final String issuer;

  public JwtService(
      @Value("${edusaldo.jwt.secret:${EDUSALDO_JWT_SECRET:}}") String secret,
      @Value("${edusaldo.jwt.expiration-seconds:3600}") long expirationSeconds,
      @Value("${edusaldo.jwt.issuer:edusaldo-auth}") String issuer) {
    this.secret = secret == null ? "" : secret.trim();
    this.expirationSeconds = expirationSeconds > 0 ? expirationSeconds : 3600;
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

  public long getExpirationSeconds() {
    return expirationSeconds;
  }

  private SecretKey signingKey() {
    if (!configured()) {
      throw new IllegalStateException("EDUSALDO_JWT_SECRET no está configurado o es insuficiente");
    }
    return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
  }

  public String emitir(Usuario usuario, String jti, Instant emision, Instant vencimiento) {
    if (usuario == null || usuario.getId() == null) {
      throw new IllegalArgumentException("Usuario inválido para emitir token");
    }
    if (jti == null || jti.isBlank()) {
      throw new IllegalArgumentException("Identificador de token obligatorio");
    }
    String rol = usuario.getRol().replace("ROLE_", "");
    return Jwts.builder()
        .header()
        .type("JWT")
        .and()
        .issuer(issuer)
        .subject(String.valueOf(usuario.getId()))
        .id(jti)
        .issuedAt(Date.from(emision))
        .expiration(Date.from(vencimiento))
        .claim("tenant", usuario.getIdEstablecimiento())
        .claim("rol", rol)
        .claim("estado", usuario.getEstado().name())
        .claim("rut", usuario.getRut())
        .claim("correo", usuario.getCorreo())
        .claim("nombre", usuario.getNombreCompleto())
        .signWith(signingKey(), Jwts.SIG.HS256)
        .compact();
  }

  public Claims verificar(String token) {
    if (token == null || token.isBlank()) {
      throw new IllegalArgumentException("Token JWT ausente");
    }
    try {
      Claims claims =
          Jwts.parser()
              .verifyWith(signingKey())
              .requireIssuer(issuer)
              .build()
              .parseSignedClaims(token.trim())
              .getPayload();
      if (claims.getSubject() == null
          || claims.getSubject().isBlank()
          || claims.getId() == null
          || claims.getId().isBlank()) {
        throw new IllegalArgumentException("Token JWT incompleto");
      }
      return claims;
    } catch (JwtException | IllegalArgumentException ex) {
      throw new IllegalArgumentException("Token JWT inválido o expirado", ex);
    }
  }
}
