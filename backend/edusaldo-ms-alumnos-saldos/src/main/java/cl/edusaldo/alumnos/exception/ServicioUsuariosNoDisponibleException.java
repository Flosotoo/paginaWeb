package cl.edusaldo.alumnos.exception;

public class ServicioUsuariosNoDisponibleException extends RuntimeException {
  public ServicioUsuariosNoDisponibleException() {
    super("No se pudo verificar la información de usuarios");
  }

  public ServicioUsuariosNoDisponibleException(Throwable cause) {
    super("No se pudo verificar la información de usuarios", cause);
  }
}
