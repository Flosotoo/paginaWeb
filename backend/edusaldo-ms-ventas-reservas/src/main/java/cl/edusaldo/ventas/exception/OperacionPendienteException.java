package cl.edusaldo.ventas.exception;

public class OperacionPendienteException extends IllegalStateException {
  private final Long operacionId;

  public OperacionPendienteException(Long id, Throwable causa) {
    super("Operación pendiente de recuperación", causa);
    this.operacionId = id;
  }

  public Long getOperacionId() {
    return operacionId;
  }
}
