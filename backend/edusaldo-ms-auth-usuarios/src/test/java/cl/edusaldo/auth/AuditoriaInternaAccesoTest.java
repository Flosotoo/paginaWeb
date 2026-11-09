package cl.edusaldo.auth;

import static org.junit.jupiter.api.Assertions.*;
import cl.edusaldo.auth.config.InternalAccessFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuditoriaInternaAccesoTest {
  @Test
  void soloGatewayConIdentidadVerificadaAccede() throws Exception {
    String key = "01234567890123456789012345678901";
    var filter = new InternalAccessFilter(key);
    for (String caller : new String[] {"ventas", "gateway"}) {
      var request = new MockHttpServletRequest("POST", "/internal/auditoria/denegacion");
      request.addHeader("X-Internal-Key", key);
      request.addHeader("X-Internal-Caller", caller);
      request.addHeader("X-Establecimiento-Id", "1");
      request.addHeader("X-Usuario-Id", "3");
      request.addHeader("X-Rol", "APODERADO");
      var response = new MockHttpServletResponse();
      var chain = new MockFilterChain();
      filter.doFilter(request, response, chain);
      assertEquals(caller.equals("gateway") ? 200 : 403, response.getStatus());
      assertEquals(caller.equals("gateway"), chain.getRequest() != null);
    }
    var anonima = new MockHttpServletRequest("POST", "/internal/auditoria/denegacion");
    var respuesta = new MockHttpServletResponse();
    filter.doFilter(anonima, respuesta, new MockFilterChain());
    assertEquals(401, respuesta.getStatus());
  }
}
