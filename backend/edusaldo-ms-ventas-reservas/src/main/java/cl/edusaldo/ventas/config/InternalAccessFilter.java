package cl.edusaldo.ventas.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@org.springframework.core.annotation.Order(0)
public class InternalAccessFilter extends OncePerRequestFilter {
  protected void doFilterInternal(
      HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    if ("OPTIONS".equals(req.getMethod())) {
      chain.doFilter(req, res);
      return;
    }
    String key = System.getenv("EDUSALDO_INTERNAL_KEY"), actual = req.getHeader("X-Internal-Key");
    if (key == null
        || key.length() < 32
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
