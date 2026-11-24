package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.auth.model.Apoderado;
import cl.edusaldo.auth.model.EstadoCuenta;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtServiceTest {
  private static final String SECRET = "clave-secreta-jwt-de-prueba-con-mas-de-32-bytes";
  private static final String OTRO_SECRET = "otra-clave-secreta-jwt-totalmente-distinta-32b";

  private Apoderado usuarioDePrueba() {
    var u = new Apoderado("12345678-5", "Carlos", "Pérez", "carlos@ejemplo.cl", "Clave1234", "+5691");
    u.setId(42L);
    u.setIdEstablecimiento(2L);
    u.setEstado(EstadoCuenta.ACTIVA);
    return u;
  }

  @Test
  void emiteYVerificaClaimsSinExponerCredenciales() {
    var jwt = new JwtService(SECRET, 3600, "edusaldo-auth");
    var u = usuarioDePrueba();
    var jti = UUID.randomUUID().toString();
    var now = Instant.now();

    String token = jwt.emitir(u, jti, now, now.plusSeconds(3600));
    String[] partes = token.split("\\.");
    assertEquals(3, partes.length);

    String payloadJson = new String(Base64.getUrlDecoder().decode(partes[1]), StandardCharsets.UTF_8);
    assertFalse(payloadJson.contains("password"));
    assertFalse(payloadJson.contains("Clave1234"));

    var claims = jwt.verificar(token);
    assertEquals("42", claims.getSubject());
    assertEquals(jti, claims.getId());
    assertEquals("edusaldo-auth", claims.getIssuer());
    assertEquals(2L, claims.get("tenant", Number.class).longValue());
    assertEquals("APODERADO", claims.get("rol", String.class));
    assertEquals("ACTIVA", claims.get("estado", String.class));
    assertEquals("12345678-5", claims.get("rut", String.class));
  }

  @Test
  void rechazaFirmaAdulteradaClaveDistintaAlgNoneYExpirado() {
    var jwt = new JwtService(SECRET, 3600, "edusaldo-auth");
    var otroJwt = new JwtService(OTRO_SECRET, 3600, "edusaldo-auth");
    var u = usuarioDePrueba();
    var now = Instant.now();

    String valido = jwt.emitir(u, UUID.randomUUID().toString(), now, now.plusSeconds(3600));
    String[] partes = valido.split("\\.");

    // Payload adulterado cambiando rol a ADMINISTRADOR conservando la firma original.
    String payloadAdulterado =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(
                "{\"iss\":\"edusaldo-auth\",\"sub\":\"42\",\"jti\":\"x\",\"rol\":\"ADMINISTRADOR\",\"tenant\":2}"
                    .getBytes(StandardCharsets.UTF_8));
    assertThrows(
        IllegalArgumentException.class,
        () -> jwt.verificar(partes[0] + "." + payloadAdulterado + "." + partes[2]));

    // Token firmado con otra clave.
    assertThrows(IllegalArgumentException.class, () -> otroJwt.verificar(valido));

    // Token sin firma (alg: none).
    String headerNone =
        Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString("{\"alg\":\"none\",\"typ\":\"JWT\"}".getBytes(StandardCharsets.UTF_8));
    assertThrows(
        IllegalArgumentException.class,
        () -> jwt.verificar(headerNone + "." + partes[1] + "."));

    // Token expirado.
    String expirado =
        jwt.emitir(u, UUID.randomUUID().toString(), now.minusSeconds(7200), now.minusSeconds(60));
    assertThrows(IllegalArgumentException.class, () -> jwt.verificar(expirado));
  }

  @Test
  void fallaCerradoSiSecretoEsInsuficiente() {
    var inseguro = new JwtService("corto", 3600, "edusaldo-auth");
    assertFalse(inseguro.configured());
    assertThrows(
        IllegalStateException.class,
        () ->
            inseguro.emitir(
                usuarioDePrueba(), UUID.randomUUID().toString(), Instant.now(), Instant.now().plusSeconds(60)));
  }
}
