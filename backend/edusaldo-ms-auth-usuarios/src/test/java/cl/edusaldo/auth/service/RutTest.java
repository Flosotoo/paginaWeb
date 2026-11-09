package cl.edusaldo.auth.service;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
class RutTest {
  @Test void validaYNormalizaFormatosEquivalentes() {
    assertEquals("12345678-5", Rut.normalizar("12.345.678-5"));
    assertEquals("12345678-5", Rut.normalizar("12345678-5"));
    assertEquals("1000005-K", Rut.normalizar("1.000.005-k"));
    assertEquals("1000005-K", Rut.normalizar("01000005-K"));
  }
  @Test void rechazaDigitoIncorrectoYCaracteresInvalidos() {
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12.345.678-9"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("12345678-5 OR 1=1"));
    assertThrows(IllegalArgumentException.class, () -> Rut.normalizar("1-9"));
  }
}
