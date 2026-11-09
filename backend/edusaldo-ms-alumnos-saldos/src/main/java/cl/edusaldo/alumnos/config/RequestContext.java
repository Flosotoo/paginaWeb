package cl.edusaldo.alumnos.config;

import java.util.Set;

public record RequestContext(
    Long establecimiento, Long usuario, String rol, String caller, int umbralSaldoBajo) {
  private static final ThreadLocal<RequestContext> CURRENT = new ThreadLocal<>();

  public static void set(RequestContext context) {
    CURRENT.set(context);
  }

  public static void clear() {
    CURRENT.remove();
  }

  public static RequestContext current() {
    RequestContext context = CURRENT.get();
    if (context == null) throw new SecurityException("Contexto de acceso requerido");
    return context;
  }

  public static Long tenant() {
    return current().establecimiento();
  }

  public static void checkTenant(Long establecimiento) {
    if (!tenant().equals(establecimiento))
      throw new SecurityException("Recurso de otro establecimiento");
  }

  public static void requireRoles(String... roles) {
    if (!Set.of(roles).contains(current().rol()))
      throw new SecurityException("Rol sin autorización para esta operación");
  }

  public static void requireActor(Long actor) {
    if (actor == null || !actor.equals(current().usuario()))
      throw new SecurityException("El responsable debe coincidir con la sesión");
  }
}
