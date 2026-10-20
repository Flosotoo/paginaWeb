package cl.edusaldo.ventas.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Cliente HTTP interno para operaciones síncronas S03, S05, S07 y S09 hacia MS Alumnos y Saldos (8092).
 */
@Component
public class SaldosClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${edusaldo.saldos.url:http://localhost:8092}")
    private String saldosBaseUrl;

    @Value("${edusaldo.interservice.enabled:true}")
    private boolean interserviceEnabled;

    /**
     * S03: Comprometer/retener saldo disponible del alumno al confirmar reserva (HU27).
     */
    public void comprometerSaldo(Long alumnoId, int monto, String referencia) {
        if (!interserviceEnabled || alumnoId == null || monto <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("alumnoId", alumnoId);
        body.put("monto", monto);
        body.put("reservaId", 1L);
        body.put("referencia", referencia);
        ejecutarPost("/api/saldos/retener", body, "No fue posible comprometer saldo del alumno " + alumnoId);
    }

    /**
     * S05: Liberar saldo comprometido al cancelar reserva antes de su entrega (HU28, HU32).
     */
    public void liberarSaldo(Long alumnoId, int monto, String referencia) {
        if (!interserviceEnabled || alumnoId == null || monto <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("alumnoId", alumnoId);
        body.put("monto", monto);
        body.put("reservaId", 1L);
        body.put("referencia", referencia);
        ejecutarPost("/api/saldos/liberar", body, "No fue posible liberar saldo comprometido del alumno " + alumnoId);
    }

    /**
     * S07: Cobrar saldo definitivo en retiro de reserva (vieneDeReserva=true) o entrega en mesón (vieneDeReserva=false).
     */
    public void descontarSaldo(Long alumnoId, int monto, boolean vieneDeReserva, String referencia) {
        if (!interserviceEnabled || alumnoId == null || monto <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("alumnoId", alumnoId);
        body.put("monto", monto);
        body.put("entregaId", 1L);
        body.put("vieneDeReserva", vieneDeReserva);
        body.put("referencia", referencia);
        ejecutarPost("/api/saldos/cobrar", body, "Saldo insuficiente o error al descontar saldo del alumno " + alumnoId);
    }

    /**
     * S09: Reintegrar saldo a la cuenta del alumno tras devolución de materiales (HU36).
     */
    public void reintegrarSaldo(Long alumnoId, int monto, String referencia, Long registradoPorId) {
        if (!interserviceEnabled || alumnoId == null || monto <= 0) {
            return;
        }
        Map<String, Object> body = new HashMap<>();
        body.put("alumnoId", alumnoId);
        body.put("monto", monto);
        body.put("devolucionId", 1L);
        body.put("referencia", referencia);
        body.put("registradoPorId", registradoPorId);
        ejecutarPost("/api/saldos/reintegrar", body, "No fue posible reintegrar saldo al alumno " + alumnoId);
    }

    private void ejecutarPost(String path, Map<String, Object> body, String errorPrefix) {
        try {
            restTemplate.postForObject(saldosBaseUrl + path, body, Map.class);
        } catch (HttpClientErrorException e) {
            throw new IllegalStateException(errorPrefix + ": " + e.getResponseBodyAsString());
        } catch (ResourceAccessException ignored) {
            // Fallback local cuando MS Saldos no está levantado en entorno aislado
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception ignored) {
        }
    }
}
