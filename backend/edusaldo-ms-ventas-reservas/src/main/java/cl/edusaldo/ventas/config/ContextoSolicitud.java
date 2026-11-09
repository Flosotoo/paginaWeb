package cl.edusaldo.ventas.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

public final class ContextoSolicitud {
  private ContextoSolicitud() {}

  private static final ThreadLocal<java.util.Map<String, String>> contextoInterno =
      new ThreadLocal<>();

  public interface Alcance extends AutoCloseable {
    void close();
  }

  public static Alcance interno(java.util.Map<String, String> headers) {
    var anterior = contextoInterno.get();
    contextoInterno.set(headers);
    return () -> {
      if (anterior == null) contextoInterno.remove();
      else contextoInterno.set(anterior);
    };
  }

  private static HttpServletRequest request() {
    return RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes a
        ? a.getRequest()
        : null;
  }

  public static String header(String name) {
    var contexto = contextoInterno.get();
    if (contexto != null && contexto.containsKey(name)) return contexto.get(name);
    HttpServletRequest r = request();
    return r == null ? null : r.getHeader(name);
  }

  public static Long establecimiento() {
    String v = header("X-Establecimiento-Id");
    if (v == null && request() == null) return 1L;
    return positivo(v, "Establecimiento requerido");
  }

  public static Long usuario(Long sugerido) {
    if (request() == null) return sugerido;
    return positivo(header("X-Usuario-Id"), "Usuario requerido");
  }

  public static String rol() {
    String v = header("X-Rol");
    if (v == null && request() == null) return "ENCARGADO";
    if (v == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Rol requerido");
    return switch (v.replace("ROLE_", "")) {
      case "ADMIN", "ADMINISTRADOR" -> "ADMINISTRADOR";
      case "ENC", "ENCARGADO" -> "ENCARGADO";
      case "APO", "APODERADO" -> "APODERADO";
      case "ALU", "ALUMNO" -> "ALUMNO";
      default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Rol inválido");
    };
  }

  public static void staff() {
    if (!rol().equals("ENCARGADO") && !rol().equals("ADMINISTRADOR"))
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Se requiere encargado o administrador");
  }

  private static Long positivo(String valor, String mensaje) {
    try {
      long n = Long.parseLong(valor);
      if (n > 0) return n;
    } catch (Exception ignored) {
    }
    throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, mensaje);
  }
}
