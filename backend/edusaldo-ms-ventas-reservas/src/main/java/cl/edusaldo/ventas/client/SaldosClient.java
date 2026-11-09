package cl.edusaldo.ventas.client;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Component
public class SaldosClient {

  private final RestTemplate restTemplate = internalTemplate();

  private static RestTemplate internalTemplate() {
    RestTemplate client = new RestTemplate();
    org.springframework.http.client.SimpleClientHttpRequestFactory factory =
        new org.springframework.http.client.SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(3000);
    factory.setReadTimeout(5000);
    client.setRequestFactory(factory);
    client
        .getInterceptors()
        .add(
            (request, body, execution) -> {
              String key = System.getenv("EDUSALDO_INTERNAL_KEY");
              if (key != null) request.getHeaders().set("X-Internal-Key", key);
              request.getHeaders().set("X-Internal-Caller", "ventas");
              for (String name :
                  java.util.List.of(
                      "X-Establecimiento-Id", "X-Usuario-Id", "X-Rol", "X-Umbral-Saldo-Bajo")) {
                String value = cl.edusaldo.ventas.config.ContextoSolicitud.header(name);
                if (value != null) request.getHeaders().set(name, value);
              }
              return execution.execute(request, body);
            });
    return client;
  }

  @Value("${edusaldo.saldos.url:http://localhost:8092}")
  private String saldosBaseUrl;

  @Value("${edusaldo.interservice.enabled:true}")
  private boolean interserviceEnabled;

  public void comprometerSaldo(Long alumnoId, int monto, String referencia, Long operacionId) {
    if (!interserviceEnabled || alumnoId == null || monto <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("alumnoId", alumnoId);
    body.put("monto", monto);
    body.put("reservaId", operacionId);
    body.put("referenciaUnica", "HOLD-" + referencia);
    ejecutarPost(
        "/api/saldos/retener", body, "No fue posible comprometer saldo del alumno " + alumnoId);
  }

  public void liberarSaldo(Long alumnoId, int monto, String referencia, Long operacionId) {
    if (!interserviceEnabled || alumnoId == null || monto <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("alumnoId", alumnoId);
    body.put("monto", monto);
    body.put("reservaId", operacionId);
    body.put("referenciaUnica", "RELEASE-" + referencia);
    ejecutarPost(
        "/api/saldos/liberar",
        body,
        "No fue posible liberar saldo comprometido del alumno " + alumnoId);
  }

  public void descontarSaldo(
      Long alumnoId,
      int monto,
      boolean vieneDeReserva,
      String referencia,
      Long operacionId,
      Long reservaId) {
    if (!interserviceEnabled || alumnoId == null || monto <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("alumnoId", alumnoId);
    body.put("monto", monto);
    body.put("entregaId", operacionId);
    body.put("vieneDeReserva", vieneDeReserva);
    body.put("reservaId", reservaId);
    body.put("referenciaUnica", "CHARGE-" + referencia);
    ejecutarPost(
        "/api/saldos/cobrar",
        body,
        "Saldo insuficiente o error al descontar saldo del alumno " + alumnoId);
  }

  public void reintegrarSaldo(
      Long alumnoId,
      int monto,
      String referencia,
      Long registradoPorId,
      Long operacionId,
      Long entregaId) {
    if (!interserviceEnabled || alumnoId == null || monto <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("alumnoId", alumnoId);
    body.put("monto", monto);
    body.put("devolucionId", operacionId);
    body.put("entregaId", entregaId);
    body.put("referenciaUnica", "REFUND-" + referencia);
    body.put("registradoPorId", registradoPorId);
    ejecutarPost(
        "/api/saldos/reintegrar", body, "No fue posible reintegrar saldo al alumno " + alumnoId);
  }

  public void compensarEntrega(Long alumnoId, int monto, Long operacionId, Long entregaId) {
    Map<String, Object> body = new HashMap<>();
    body.put("alumnoId", alumnoId);
    body.put("monto", monto);
    body.put("entregaId", entregaId);
    body.put("operacionCompensacionId", operacionId);
    body.put("referenciaUnica", "COMPENSACION-" + operacionId);
    ejecutarPost("/api/saldos/reintegrar", body, "No fue posible compensar el saldo");
  }

  private void ejecutarPost(String path, Map<String, Object> body, String errorPrefix) {
    try {
      restTemplate.postForObject(saldosBaseUrl + path, body, Map.class);
    } catch (HttpClientErrorException e) {
      if (java.util.Set.of(400, 404, 409, 422).contains(e.getStatusCode().value()))
        throw new cl.edusaldo.ventas.exception.RechazoRemotoException(
            errorPrefix + ": " + e.getResponseBodyAsString(), e);
      throw new IllegalStateException("Servicio remoto rechazó temporalmente la operación", e);
    } catch (ResourceAccessException ignored) {
      throw new IllegalStateException("Servicio requerido no disponible", ignored);
    } catch (IllegalStateException e) {
      throw e;
    } catch (Exception ignored) {
      throw new IllegalStateException("Falló la operación entre servicios", ignored);
    }
  }
}
