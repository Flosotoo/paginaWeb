package cl.edusaldo.auth.service;

import java.security.*;
import java.util.*;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

public final class PasswordCodec {
  public static String hash(String raw) {
    byte[] salt = new byte[16];
    new SecureRandom().nextBytes(salt);
    return "pbkdf2$"
        + Base64.getEncoder().encodeToString(salt)
        + "$"
        + Base64.getEncoder().encodeToString(derive(raw, salt));
  }

  private static byte[] derive(String raw, byte[] salt) {
    try {
      return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
          .generateSecret(new PBEKeySpec(raw.toCharArray(), salt, 210000, 256))
          .getEncoded();
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }

  public static boolean matches(String raw, String encoded) {
    if (raw == null || encoded == null) return false;
    if (!encoded.startsWith("pbkdf2$"))
      return MessageDigest.isEqual(
          raw.getBytes(java.nio.charset.StandardCharsets.UTF_8),
          encoded.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    try {
      String[] parts = encoded.split("\\$");
      return MessageDigest.isEqual(
          derive(raw, Base64.getDecoder().decode(parts[1])), Base64.getDecoder().decode(parts[2]));
    } catch (IllegalArgumentException e) {
      return false;
    }
  }
}
