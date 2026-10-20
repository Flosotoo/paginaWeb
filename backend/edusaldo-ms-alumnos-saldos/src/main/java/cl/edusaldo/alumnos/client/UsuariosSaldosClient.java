package cl.edusaldo.alumnos.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
public class UsuariosSaldosClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${edusaldo.interservice.enabled:true}")
    private boolean interserviceEnabled = true;

    @Value("${edusaldo.services.usuarios-url:http://localhost:8091}")
    private String usuariosBaseUrl = "http://localhost:8091";

    /**
     * S12: Valida que el apoderado exista, esté activo y tenga autorizadoCentroPadres == true.
     */
    @SuppressWarnings("unchecked")
    public void validarAutorizacionCentroPadres(Long apoderadoId) {
        if (!interserviceEnabled || apoderadoId == null) {
            return;
        }
        try {
            Map<String, Object> resp = restTemplate.getForObject(
                    usuariosBaseUrl + "/api/usuarios/" + apoderadoId, Map.class);
            if (resp != null) {
                Object autorizado = resp.get("autorizadoCentroPadres");
                if (!Boolean.parseBoolean(String.valueOf(autorizado))) {
                    throw new IllegalStateException("El apoderado ID " + apoderadoId
                            + " no posee autorización del Centro de Padres para validar transferencias bancarias (HU20 / S12).");
                }
            }
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ignored) {
            // Fallback resiliente si MS Usuarios no está levantado en entorno aislado
        }
    }
}
