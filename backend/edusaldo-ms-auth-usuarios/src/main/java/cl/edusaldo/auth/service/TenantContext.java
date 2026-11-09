package cl.edusaldo.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

/**
 * The transport credential prevents external callers from selecting the trusted tenant or actor.
 */
public final class TenantContext {
  private TenantContext() {}

  public static String header(String name) {
    var attributes = RequestContextHolder.getRequestAttributes();
    return attributes instanceof ServletRequestAttributes request
        ? request.getRequest().getHeader(name)
        : null;
  }

  public static Long current() {
    String value = header("X-Establecimiento-Id");
    return value == null ? 1L : positive(value);
  }

  public static Long actor() {
    String value = header("X-Usuario-Id");
    return value == null ? null : positive(value);
  }

  public static String role() {
    String value = header("X-Rol");
    return value == null ? "" : value;
  }

  public static boolean technical() {
    return java.util.Set.of("ventas", "saldos")
        .contains(String.valueOf(header("X-Internal-Caller")));
  }

  public static void requireTenant(Long tenant) {
    if (!current().equals(tenant))
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Recurso fuera del establecimiento");
  }

  public static void requireOwn(Long usuario) {
    if (actor() != null && !actor().equals(usuario))
      throw new ResponseStatusException(
          HttpStatus.FORBIDDEN, "Solo puede gestionar sus propios datos");
  }

  private static Long positive(String value) {
    try {
      long id = Long.parseLong(value);
      if (id > 0) return id;
    } catch (NumberFormatException ignored) {
    }
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Contexto inválido");
  }
}
