package cl.edusaldo.alumnos.config;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
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

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    if (swaggerPublic && "GET".equalsIgnoreCase(request.getMethod()) && esRutaSwagger(path)) {
      chain.doFilter(request, response);
      return;
    }
    String actual = request.getHeader("X-Internal-Key");
    if (key.length() < 32
        || actual == null
        || !MessageDigest.isEqual(
            key.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8))) {
      reject(response, 401, "Acceso interno no autorizado");
      return;
    }
    if ("/internal/salud".equals(path)) {
      chain.doFilter(request, response);
      return;
    }
    String caller = request.getHeader("X-Internal-Caller");
    if (!Set.of("gateway", "ventas", "saldos").contains(caller == null ? "" : caller)) {
      reject(response, 403, "Emisor interno no autorizado");
      return;
    }
    if ("gateway".equals(caller)
        && Set.of(
                "/api/saldos/retener",
                "/api/saldos/liberar",
                "/api/saldos/cobrar",
                "/api/saldos/reintegrar",
                "/api/inventario/retener",
                "/api/inventario/liberar",
                "/api/inventario/descontar",
                "/api/inventario/reingresar")
            .contains(path)) {
      reject(response, 403, "Operación exclusiva entre servicios");
      return;
    }
    try {
      Long tenant = positive(request.getHeader("X-Establecimiento-Id"));
      Long usuario = positive(request.getHeader("X-Usuario-Id"));
      String rol = request.getHeader("X-Rol");
      if (!Set.of("ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO")
          .contains(rol == null ? "" : rol)) throw new IllegalArgumentException();
      String threshold = request.getHeader("X-Umbral-Saldo-Bajo");
      int umbral = Integer.parseInt(threshold);
      if (umbral < 0) throw new IllegalArgumentException();
      RequestContext.set(new RequestContext(tenant, usuario, rol, caller, umbral));
    } catch (IllegalArgumentException exception) {
      reject(response, 400, "Contexto de establecimiento o sesión inválido");
      return;
    }
    try {
      chain.doFilter(request, response);
    } finally {
      RequestContext.clear();
    }
  }

  private static Long positive(String value) {
    long number = Long.parseLong(value);
    if (number <= 0) throw new IllegalArgumentException();
    return number;
  }

  private static void reject(HttpServletResponse response, int status, String message)
      throws IOException {
    response.setStatus(status);
    response.setContentType("application/json");
    response.getWriter().write("{\"message\":\"" + message + "\"}");
  }
}
