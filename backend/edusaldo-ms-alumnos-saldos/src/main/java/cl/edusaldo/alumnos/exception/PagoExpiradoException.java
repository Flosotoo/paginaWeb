package cl.edusaldo.alumnos.exception;

public class PagoExpiradoException extends IllegalStateException {
  public PagoExpiradoException(String message) {
    super(message);
  }
}
