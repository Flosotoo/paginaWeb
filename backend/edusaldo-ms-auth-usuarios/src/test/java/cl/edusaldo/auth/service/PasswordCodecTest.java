package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class PasswordCodecTest {
  @Test
  void passwordIsSaltedAndOtherCredentialsAreRejected() {
    String first = PasswordCodec.hash("ClavePersonal123!");
    String second = PasswordCodec.hash("ClavePersonal123!");
    assertNotEquals(first, second);
    assertTrue(PasswordCodec.matches("ClavePersonal123!", first));
    assertFalse(PasswordCodec.matches("admin123", first));
    assertFalse(PasswordCodec.matches("Edu123456", first));
    assertFalse(PasswordCodec.matches("ClavePersonal123!", "pbkdf2$invalid$invalid"));
  }

  @Test
  void legacySeedMatchesOnlyItsOwnPassword() {
    assertTrue(PasswordCodec.matches("Semilla123", "Semilla123"));
    assertFalse(PasswordCodec.matches("admin123", "Semilla123"));
  }
}
