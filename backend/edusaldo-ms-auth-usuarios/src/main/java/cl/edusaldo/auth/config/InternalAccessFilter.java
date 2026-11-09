package cl.edusaldo.auth.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * An independent transport credential keeps business services reachable only through trusted
 * callers.
 */
@Component
@Order(-100)
public class InternalAccessFilter extends OncePerRequestFilter {
  private final String key;

  public InternalAccessFilter(@Value("${EDUSALDO_INTERNAL_KEY:}") String key) {
    this.key = key;
  }

  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    String actual = req.getHeader("X-Internal-Key");
    if (key.length() < 32
        || actual == null
        || !MessageDigest.isEqual(
            key.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8))) {
      reject(res, 401);
      return;
    }
    String path = req.getRequestURI();
    if (path.equals("/internal/auditoria/denegacion")
        && (!"POST".equals(req.getMethod())
            || !"gateway".equals(req.getHeader("X-Internal-Caller"))
            || !positive(req.getHeader("X-Establecimiento-Id"))
            || !positive(req.getHeader("X-Usuario-Id"))
            || !Set.of("ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO")
                .contains(String.valueOf(req.getHeader("X-Rol"))))) {
      reject(res, 403);
      return;
    }
    boolean infrastructure =
        path.equals("/internal/salud") || path.equals("/internal/sesiones/validar");
    boolean publicAuth =
        Set.of(
                    "/api/auth/login",
                    "/api/auth/recuperar-password",
                    "/api/auth/confirmar-recuperacion")
                .contains(path)
            && req.getMethod().equals("POST");
    if (!infrastructure && !publicAuth && path.startsWith("/api/")) {
      String caller = req.getHeader("X-Internal-Caller");
      if (!Set.of("gateway", "ventas", "saldos").contains(String.valueOf(caller))
          || !positive(req.getHeader("X-Establecimiento-Id"))) {
        reject(res, 403);
        return;
      }
      if ("gateway".equals(caller)
          && (!positive(req.getHeader("X-Usuario-Id"))
              || !Set.of("ADMINISTRADOR", "ENCARGADO", "APODERADO", "ALUMNO")
                  .contains(String.valueOf(req.getHeader("X-Rol"))))) {
        reject(res, 403);
        return;
      }
      // Restricting technical callers to identity reads prevents bypassing user write permissions.
      if (!"gateway".equals(caller)
          && (!req.getMethod().equals("GET") || !path.startsWith("/api/usuarios/"))) {
        reject(res, 403);
        return;
      }
    }
    chain.doFilter(req, res);
  }

  private boolean positive(String value) {
    try {
      return Long.parseLong(value) > 0;
    } catch (Exception ignored) {
      return false;
    }
  }

  private void reject(HttpServletResponse res, int status) throws IOException {
    res.setStatus(status);
    res.setContentType("application/json");
    res.getWriter()
        .write("{\"status\":" + status + ",\"message\":\"Acceso interno no autorizado\"}");
  }
}
