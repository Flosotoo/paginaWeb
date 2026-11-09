package cl.edusaldo.auth.exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalArgument(
      IllegalArgumentException ex, WebRequest req) {
    Map<String, Object> err = new HashMap<>();
    err.put("timestamp", LocalDateTime.now());
    err.put("status", HttpStatus.BAD_REQUEST.value());
    err.put("error", "Bad Request");
    err.put("message", ex.getMessage());
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
  }

  @ExceptionHandler(IllegalStateException.class)
  public ResponseEntity<Map<String, Object>> handleIllegalState(
      IllegalStateException ex, WebRequest req) {
    Map<String, Object> err = new HashMap<>();
    err.put("timestamp", LocalDateTime.now());
    err.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
    err.put("error", "Unprocessable Entity");
    err.put("message", ex.getMessage());
    return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(err);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, Object> err = new HashMap<>();
    err.put("timestamp", LocalDateTime.now());
    err.put("status", HttpStatus.BAD_REQUEST.value());
    err.put("error", "Validation Error");
    String firstErr =
        ex.getBindingResult().getFieldErrors().stream()
            .map(f -> f.getField() + ": " + f.getDefaultMessage())
            .findFirst()
            .orElse("Datos inválidos");
    err.put("message", firstErr);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(err);
  }

  @ExceptionHandler({
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    ArithmeticException.class
  })
  public ResponseEntity<Map<String, Object>> handleInvalidNumber(Exception ex) {
    return ResponseEntity.badRequest()
        .body(
            Map.of(
                "status",
                400,
                "error",
                "Bad Request",
                "message",
                "JSON o valores numéricos inválidos"));
  }

  @ExceptionHandler({
    org.springframework.dao.ConcurrencyFailureException.class,
    org.springframework.dao.DataIntegrityViolationException.class
  })
  public ResponseEntity<Map<String, Object>> handleConflict(Exception ex) {
    return ResponseEntity.status(HttpStatus.CONFLICT)
        .body(
            Map.of(
                "status",
                409,
                "error",
                "Conflict",
                "message",
                "La operación entra en conflicto con el estado actual; consulte su resultado antes"
                    + " de reintentar"));
  }

  @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
  public ResponseEntity<Map<String, Object>> status(
      org.springframework.web.server.ResponseStatusException ex) {
    return ResponseEntity.status(ex.getStatusCode())
        .body(
            Map.of(
                "status",
                ex.getStatusCode().value(),
                "message",
                ex.getReason() == null ? "Acceso rechazado" : ex.getReason()));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
    Map<String, Object> err = new HashMap<>();
    err.put("timestamp", LocalDateTime.now());
    err.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
    err.put("error", "Internal Server Error");
    err.put("message", "Error interno al procesar la operación");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(err);
  }
}
