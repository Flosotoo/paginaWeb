package cl.edusaldo.ventas.client;

import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Component
public class InventarioClient {

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

  @Value("${edusaldo.inventario.url:http://localhost:8093}")
  private String inventarioBaseUrl;

  @Value("${edusaldo.interservice.enabled:true}")
  private boolean interserviceEnabled;

  @SuppressWarnings("unchecked")
  public Map<String, Object> consultarProductoActivo(Long productoId) {
    if (!interserviceEnabled || productoId == null) {
      return null;
    }
    try {
      Map<String, Object> producto =
          restTemplate.getForObject(inventarioBaseUrl + "/api/productos/" + productoId, Map.class);
      if (producto != null) {
        if ("INACTIVO".equals(String.valueOf(producto.get("estado")))) {
          throw new IllegalStateException(
              "El producto ID " + productoId + " se encuentra inactivo y no está disponible.");
        }
        return producto;
      }
    } catch (HttpClientErrorException.NotFound e) {
      throw new IllegalArgumentException(
          "El producto ID " + productoId + " no existe en el catálogo.");
    } catch (ResourceAccessException ignored) {
      throw new IllegalStateException("Servicio requerido no disponible", ignored);
    } catch (IllegalStateException | IllegalArgumentException e) {
      throw e;
    } catch (Exception ignored) {
      throw new IllegalStateException("Falló la operación entre servicios", ignored);
    }
    return null;
  }

  public void reservarStock(Long productoId, int cantidad, Long usuarioId, Long operacionId) {
    if (!interserviceEnabled || productoId == null || cantidad <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("productoId", productoId);
    body.put("referenciaUnica", "HOLD-" + operacionId + "-" + productoId);
    body.put("cantidad", cantidad);
    body.put("reservaId", operacionId);
    body.put("usuarioId", usuarioId);
    ejecutarPost(
        "/api/inventario/retener",
        body,
        "Stock insuficiente para reservar producto ID " + productoId);
  }

  public void liberarStock(Long productoId, int cantidad, Long usuarioId, Long operacionId) {
    if (!interserviceEnabled || productoId == null || cantidad <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("productoId", productoId);
    body.put("referenciaUnica", "RELEASE-" + operacionId + "-" + productoId);
    body.put("cantidad", cantidad);
    body.put("reservaId", operacionId);
    body.put("usuarioId", usuarioId);
    ejecutarPost(
        "/api/inventario/liberar",
        body,
        "Error al liberar stock reservado de producto ID " + productoId);
  }

  public void descontarStock(
      Long productoId,
      int cantidad,
      boolean vieneDeReserva,
      Long usuarioId,
      Long operacionId,
      Long reservaId) {
    if (!interserviceEnabled || productoId == null || cantidad <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("productoId", productoId);
    body.put("referenciaUnica", "CHARGE-" + operacionId + "-" + productoId);
    body.put("cantidad", cantidad);
    body.put("entregaId", operacionId);
    body.put("vieneDeReserva", vieneDeReserva);
    body.put("reservaId", reservaId);
    body.put("usuarioId", usuarioId);
    ejecutarPost(
        "/api/inventario/descontar",
        body,
        "Stock físico insuficiente para entregar producto ID " + productoId);
  }

  public void reingresarStock(
      Long productoId,
      int cantidad,
      Long usuarioId,
      String motivo,
      Long operacionId,
      Long entregaId) {
    if (!interserviceEnabled || productoId == null || cantidad <= 0) {
      return;
    }
    Map<String, Object> body = new HashMap<>();
    body.put("productoId", productoId);
    body.put("referenciaUnica", "REFUND-" + operacionId + "-" + productoId);
    body.put("cantidad", cantidad);
    body.put("devolucionId", operacionId);
    body.put("entregaId", entregaId);
    body.put("usuarioId", usuarioId);
    body.put("motivo", motivo != null ? motivo : "Reingreso por devolución");
    ejecutarPost(
        "/api/inventario/reingresar",
        body,
        "Error al reingresar stock de producto ID " + productoId);
  }

  public void compensarEntrega(
      Long productoId, int cantidad, Long usuarioId, Long operacionId, Long entregaId) {
    Map<String, Object> body = new HashMap<>();
    body.put("productoId", productoId);
    body.put("cantidad", cantidad);
    body.put("entregaId", entregaId);
    body.put("usuarioId", usuarioId);
    body.put("operacionCompensacionId", operacionId);
    body.put("referenciaUnica", "COMPENSACION-" + operacionId + "-" + productoId);
    ejecutarPost("/api/inventario/reingresar", body, "No fue posible compensar el stock");
  }

  private void ejecutarPost(String path, Map<String, Object> body, String errorPrefix) {
    try {
      restTemplate.postForObject(inventarioBaseUrl + path, body, Map.class);
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
