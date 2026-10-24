package cl.edusaldo.ventas.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Cliente HTTP interno para operaciones síncronas S01 y S02 hacia MS Auth y Usuarios (8091).
 */
@Component
public class UsuariosClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${edusaldo.usuarios.url:http://localhost:8091}")
    private String usuariosBaseUrl;

    @Value("${edusaldo.interservice.enabled:true}")
    private boolean interserviceEnabled;

    /**
     * S01: Validar existencia de alumno activo y vigencia del vínculo Apoderado-Alumno.
     */
    @SuppressWarnings("unchecked")
    public void validarAlumnoYVinculo(Long alumnoId, Long solicitanteId) {
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
            if (solicitanteId != null && !solicitanteId.equals(alumnoId)) {
                Map<String, Object> solicitante = restTemplate.getForObject(
                        usuariosBaseUrl + "/api/usuarios/" + solicitanteId, Map.class);
                if (solicitante != null && "ROLE_APODERADO".equals(String.valueOf(solicitante.get("rol")))) {
                    List<Map<String, Object>> pupilos = restTemplate.getForObject(
                            usuariosBaseUrl + "/api/usuarios/apoderados/" + solicitanteId + "/alumnos", List.class);
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
            throw new IllegalArgumentException("El alumno ID " + alumnoId + " no existe en MS Usuarios.");
        } catch (ResourceAccessException ignored) {
            // Fallback local cuando MS Usuarios no está levantado en entorno aislado
        } catch (IllegalStateException | IllegalArgumentException e) {
            throw e;
        } catch (Exception ignored) {
        }
    }

    /**
     * S02: Validar edad mínima (>= 12 años) cuando quien reserva en línea es el propio alumno.
     */
    @SuppressWarnings("unchecked")
    public void validarAutonomiaReserva(Long alumnoId, Long creadaPorId) {
        if (!interserviceEnabled || alumnoId == null || !alumnoId.equals(creadaPorId)) {
            return;
        }
        try {
            Map<String, Object> resp = restTemplate.getForObject(
                    usuariosBaseUrl + "/api/usuarios/alumnos/" + alumnoId + "/puede-reservar", Map.class);
            if (resp != null && Boolean.FALSE.equals(resp.get("puedeReservar"))) {
                throw new IllegalStateException("El alumno menor de 12 años no está habilitado para confirmar reservas por sí mismo.");
            }
        } catch (ResourceAccessException ignored) {
            // Fallback local en tests aislados
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception ignored) {
        }
    }
}
