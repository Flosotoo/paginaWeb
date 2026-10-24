package cl.edusaldo.ventas.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente HTTP interno para operaciones síncronas S04, S06, S08 y S10 hacia MS Productos e Inventario (8093).
 */
@Component
public class InventarioClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${edusaldo.inventario.url:http://localhost:8093}")
    private String inventarioBaseUrl;

    @Value("${edusaldo.interservice.enabled:true}")
    private boolean interserviceEnabled;

    /**
     * S03: Consultar producto activo en el catálogo oficial (HU39 CA3).
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> consultarProductoActivo(Long productoId) {
        if (!interserviceEnabled || productoId == null) {
            return null;
        }
        try {
            Map<String, Object> producto = restTemplate.getForObject(
                    inventarioBaseUrl + "/api/productos/" + productoId, Map.class);
            if (producto != null) {
                if ("INACTIVO".equals(String.valueOf(producto.get("estado")))) {
                    throw new IllegalStateException("El producto ID " + productoId + " se encuentra inactivo y no está disponible.");
                }
                return producto;
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalArgumentException("El producto ID " + productoId + " no existe en el catálogo.");
        } catch (ResourceAccessException ignored) {
            // Fallback local cuando MS Inventario no está levantado en entorno aislado
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
        }
        return null;
    }

    /**
     * S04: Retener/reservar stock de producto al confirmar reserva (HU27).
     */
    public void reservarStock(Long productoId, int cantidad, Long usuarioId) {
        if (!interserviceEnabled || productoId == null || cantidad <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("productoId", productoId);
        body.put("cantidad", cantidad);
        body.put("reservaId", 1L);
        body.put("usuarioId", usuarioId != null ? usuarioId : 1L);
        ejecutarPost("/api/inventario/retener", body, "Stock insuficiente para reservar producto ID " + productoId);
    }

    /**
     * S06: Liberar stock reservado al cancelar reserva (HU28, HU32).
     */
    public void liberarStock(Long productoId, int cantidad, Long usuarioId) {
        if (!interserviceEnabled || productoId == null || cantidad <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("productoId", productoId);
        body.put("cantidad", cantidad);
        body.put("reservaId", 1L);
        body.put("usuarioId", usuarioId != null ? usuarioId : 1L);
        ejecutarPost("/api/inventario/liberar", body, "Error al liberar stock reservado de producto ID " + productoId);
    }

    /**
     * S08: Descontar stock físico al entregar pedido o entrega en mesón (HU33, HU34).
     */
    public void descontarStock(Long productoId, int cantidad, boolean vieneDeReserva, Long usuarioId) {
        if (!interserviceEnabled || productoId == null || cantidad <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("productoId", productoId);
        body.put("cantidad", cantidad);
        body.put("entregaId", 1L);
        body.put("vieneDeReserva", vieneDeReserva);
        body.put("usuarioId", usuarioId != null ? usuarioId : 1L);
        ejecutarPost("/api/inventario/descontar", body, "Stock físico insuficiente para entregar producto ID " + productoId);
    }

    /**
     * S10: Reingresar stock físico tras devolución de materiales (HU36).
     */
    public void reingresarStock(Long productoId, int cantidad, Long usuarioId, String motivo) {
        if (!interserviceEnabled || productoId == null || cantidad <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("productoId", productoId);
        body.put("cantidad", cantidad);
        body.put("devolucionId", 1L);
        body.put("usuarioId", usuarioId != null ? usuarioId : 1L);
        body.put("motivo", motivo != null ? motivo : "Reingreso por devolución");
        ejecutarPost("/api/inventario/reingresar", body, "Error al reingresar stock de producto ID " + productoId);
    }

    private void ejecutarPost(String path, Map<String, Object> body, String errorPrefix) {
        try {
            restTemplate.postForObject(inventarioBaseUrl + path, body, Map.class);
        } catch (HttpClientErrorException e) {
            throw new IllegalStateException(errorPrefix + ": " + e.getResponseBodyAsString());
        } catch (ResourceAccessException ignored) {
            // Fallback local cuando MS Inventario no está levantado en entorno aislado
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception ignored) {
        }
    }
}
