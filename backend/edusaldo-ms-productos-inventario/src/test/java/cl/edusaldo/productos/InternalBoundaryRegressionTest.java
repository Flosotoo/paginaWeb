package cl.edusaldo.productos;

import static org.junit.jupiter.api.Assertions.*;

import cl.edusaldo.productos.config.InternalAccessFilter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.*;

class InternalBoundaryRegressionTest {
  private MockHttpServletRequest request(String path) {
    var r = new MockHttpServletRequest("POST", path);
    r.addHeader("X-Internal-Key", "01234567890123456789012345678901");
    r.addHeader("X-Internal-Caller", "gateway");
    r.addHeader("X-Establecimiento-Id", "1");
    r.addHeader("X-Usuario-Id", "2");
    r.addHeader("X-Rol", "ADMINISTRADOR");
    return r;
  }

  @Test
  void gatewayNoPuedeMutarCompromisos() throws Exception {
    var r = request("/api/inventario/retener");
    var s = new MockHttpServletResponse();
    new InternalAccessFilter("01234567890123456789012345678901").doFilter(r, s, (a, b) -> {});
    assertEquals(403, s.getStatus());
  }

  @Test
  void rechazaTenantAusente() throws Exception {
    var r = request("/api/inventario");
    r.removeHeader("X-Establecimiento-Id");
    var s = new MockHttpServletResponse();
    new InternalAccessFilter("01234567890123456789012345678901").doFilter(r, s, (a, b) -> {});
    assertEquals(400, s.getStatus());
  }

  @Test
  void contextoSeLimpiaInclusoSiElControladorFalla() throws Exception {
    var r = request("/api/catalogo");
    r.addHeader("X-Umbral-Saldo-Bajo", "1500");
    var s = new MockHttpServletResponse();
    assertThrows(
        jakarta.servlet.ServletException.class,
        () ->
            new InternalAccessFilter("01234567890123456789012345678901")
                .doFilter(
                    r,
                    s,
                    (a, b) -> {
                      assertEquals(1L, cl.edusaldo.productos.config.RequestContext.tenant());
                      throw new jakarta.servlet.ServletException("Fallo");
                    }));
    assertThrows(SecurityException.class, cl.edusaldo.productos.config.RequestContext::current);
  }

  @Test
  void corsPermitePreflightLocalYRechazaOrigenAjeno() throws Exception {
    org.springframework.boot.web.servlet.FilterRegistrationBean<
            org.springframework.web.filter.CorsFilter>
        registration =
            org.springframework.test.util.ReflectionTestUtils.invokeMethod(
                new cl.edusaldo.productos.config.CorsConfig(), "corsFilter");
    var allowed = new MockHttpServletRequest("OPTIONS", "/api/catalogo");
    allowed.addHeader("Origin", "http://localhost:5173");
    allowed.addHeader("Access-Control-Request-Method", "POST");
    allowed.addHeader("Access-Control-Request-Headers", "Authorization,Content-Type");
    var response = new MockHttpServletResponse();
    registration
        .getFilter()
        .doFilter(
            allowed, response, (a, b) -> fail("El preflight no debe alcanzar la autenticación"));
    assertEquals(200, response.getStatus());
    assertEquals("http://localhost:5173", response.getHeader("Access-Control-Allow-Origin"));
    var forbidden = new MockHttpServletRequest("GET", "/api/catalogo");
    forbidden.addHeader("Origin", "https://ajeno.example");
    var reject = new MockHttpServletResponse();
    registration
        .getFilter()
        .doFilter(forbidden, reject, (a, b) -> fail("No debe llegar al servicio"));
    assertEquals(403, reject.getStatus());
  }
}
