package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;
import cl.edusaldo.productos.dto.AprobarAjusteDTO;
import cl.edusaldo.productos.dto.RechazarAjusteDTO;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ContratoAjusteTest {
  @Test
  void soloElCampoAdministradorRepresentaAlResponsable() throws Exception {
    var json = new ObjectMapper().disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
    assertNull(json.readValue("{\"autorizadorId\":7}", AprobarAjusteDTO.class).getAdministradorId());
    assertNull(json.readValue("{\"autorizadorId\":7}", RechazarAjusteDTO.class).getAdministradorId());
    assertEquals(7L, json.readValue("{\"administradorId\":7}", AprobarAjusteDTO.class).getAdministradorId());
  }
}
