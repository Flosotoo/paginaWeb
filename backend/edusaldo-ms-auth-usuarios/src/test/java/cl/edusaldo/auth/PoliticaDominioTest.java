package cl.edusaldo.auth;
import static org.junit.jupiter.api.Assertions.*;
import cl.edusaldo.auth.model.PoliticaAcceso;
import org.junit.jupiter.api.Test;
class PoliticaDominioTest {
  @Test void aceptaPoliticaValida() {
    var p = new PoliticaAcceso(5, 15, 12, 3000); p.modificar(4, 20, 12, 2000);
    assertEquals(4, p.getMaxIntentosFallidos()); assertEquals(20, p.getMinutosBloqueo()); assertEquals(2000, p.getUmbralSaldoBajoClp());
  }
  @Test void rechazaPoliticaInvalidaSinCambiosParciales() {
    var p = new PoliticaAcceso(5, 15, 12, 3000);
    assertThrows(IllegalArgumentException.class, () -> p.modificar(4, 0, 12, 2000));
    assertEquals(5, p.getMaxIntentosFallidos()); assertEquals(15, p.getMinutosBloqueo()); assertEquals(3000, p.getUmbralSaldoBajoClp());
    assertThrows(IllegalArgumentException.class, () -> p.modificar(4, 20, 13, 2000));
    assertEquals(12, p.getEdadMinimaAlumno());
  }
}
