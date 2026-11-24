package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class RutTest {
  @Test
  void validaYNormalizaFormatosEquivalentesYTolerantes() {
    assertEquals("12345678-5", Rut.normalizar("12.345.678-5"));
    assertEquals("12345678-5", Rut.normalizar("12345678-5"));
    assertEquals("12345678-5", Rut.normalizar("123456785"));
    assertEquals("12345678-5", Rut.normalizar(" 12.345.678 \u2013 5 "));
    assertEquals("1000005-K", Rut.normalizar("1.000.005-k"));
    assertEquals("1000005-K", Rut.normalizar("01000005-K"));
    assertEquals("1000005-K", Rut.normalizar("1000005k"));
    assertEquals("11111111-1", Rut.normalizar("11.111.111-1"));
  }

  @Test
  void rechazaDigitoIncorrectoFueraDeRangoYEntradasMaliciosas() {
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar(null));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("   "));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12.345.678-9"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12345678-5 OR 1=1"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("<script>12345678-5</script>"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("1-9"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("00000000-0"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12..345.678-5"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("1234-5678-5"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12K45678-5"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("1".repeat(40) + "-5"));
  }
}
