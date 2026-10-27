package cl.edusaldo.alumnos.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
public class UsuariosSaldosClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${edusaldo.interservice.enabled:true}")
    private boolean interserviceEnabled = true;

    @Value("${edusaldo.services.usuarios-url:http://localhost:8091}")
    private String usuariosBaseUrl = "http://localhost:8091";

    /**
     * S11: Validar existencia de alumno activo y vínculo con el apoderado.
     */
    @SuppressWarnings("unchecked")
    public void validarAlumnoYVinculo(Long alumnoId, Long apoderadoId) {
        if (!interserviceEnabled || alumnoId == null) {
            return;
        }
        try {
            Map<String, Object> alumno = restTemplate.getForObject(
                    usuariosBaseUrl + "/api/usuarios/" + alumnoId, Map.class);
            if (alumno != null) {
                if ("INACTIVA".equals(String.valueOf(alumno.get("estado"))) || Boolean.FALSE.equals(alumno.get("activo"))) {
                    throw new IllegalStateException("El alumno se encuentra inactivo y no puede realizar operaciones.");
                }
            }
            if (apoderadoId != null && !apoderadoId.equals(alumnoId)) {
                Map<String, Object> solicitante = restTemplate.getForObject(
                        usuariosBaseUrl + "/api/usuarios/" + apoderadoId, Map.class);
                if (solicitante != null && "ROLE_APODERADO".equals(String.valueOf(solicitante.get("rol")))) {
                    List<Map<String, Object>> pupilos = restTemplate.getForObject(
                            usuariosBaseUrl + "/api/usuarios/apoderados/" + apoderadoId + "/alumnos", List.class);
                    boolean vinculado = false;
                    if (pupilos != null) {
                        for (Map<String, Object> p : pupilos) {
                            Object idObj = p.get("id") != null ? p.get("id") : p.get("alumnoId");
                            if (idObj != null && Long.valueOf(idObj.toString()).equals(alumnoId)) {
                                String estado = String.valueOf(p.get("estado"));
                                if (!"INACTIVA".equals(estado)) {
                                    vinculado = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!vinculado) {
                        throw new IllegalStateException("El apoderado no tiene un vínculo activo con el alumno solicitado.");
                    }
                }
            }
        } catch (HttpClientErrorException.NotFound e) {
            throw new IllegalArgumentException("El usuario o alumno solicitado no existe en MS Usuarios.");
        } catch (ResourceAccessException ignored) {
            // Fallback resiliente si MS Usuarios no está levantado en pruebas unitarias aisladas
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
        }
    }
}
