package cl.edusaldo.ventas.config;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@org.springframework.core.annotation.Order(0)
public class InternalAccessFilter extends OncePerRequestFilter {
  private final String key;
  private final boolean swaggerPublic;

  @Autowired
  public InternalAccessFilter(
      @Value("${edusaldo.internal.key:${EDUSALDO_INTERNAL_KEY:}}") String key,
      @Value("${edusaldo.swagger.public:true}") boolean swaggerPublic) {
    this.key = key == null ? "" : key;
    this.swaggerPublic = swaggerPublic;
  }

  public InternalAccessFilter() {
    this("", true);
  }

  public InternalAccessFilter(String key) {
    this(key, true);
  }

  @PostConstruct
  void validarConfiguracion() {
    if (key.length() < 32) {
      throw new IllegalStateException(
          "Configuración inválida: edusaldo.internal.key (EDUSALDO_INTERNAL_KEY) debe tener al menos 32 caracteres.");
    }
  }

  private static boolean esRutaSwagger(String path) {
    return "/swagger-ui.html".equals(path)
        || path.startsWith("/swagger-ui/")
        || "/api-docs".equals(path)
        || path.startsWith("/api-docs/")
        || "/v3/api-docs".equals(path)
        || path.startsWith("/v3/api-docs/");
  }

  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    if ("OPTIONS".equals(req.getMethod())) {
      chain.doFilter(req, res);
      return;
    }
    String path = req.getRequestURI();
    if (swaggerPublic && "GET".equalsIgnoreCase(req.getMethod()) && esRutaSwagger(path)) {
      chain.doFilter(req, res);
      return;
    }
    String actual = req.getHeader("X-Internal-Key");
    if (key.length() < 32
        || actual == null
        || !MessageDigest.isEqual(
            key.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8))) {
      res.setStatus(401);
      res.setContentType("application/json");
      res.getWriter().write("{\"message\":\"Acceso interno no autorizado\"}");
      return;
    }
    chain.doFilter(req, res);
  }
}
