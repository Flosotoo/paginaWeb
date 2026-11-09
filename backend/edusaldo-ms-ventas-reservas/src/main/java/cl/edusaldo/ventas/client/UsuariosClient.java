package cl.edusaldo.ventas.client;

import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

@Component
public class UsuariosClient {

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

  @Value("${edusaldo.usuarios.url:http://localhost:8091}")
  private String usuariosBaseUrl;

  @Value("${edusaldo.interservice.enabled:true}")
  private boolean interserviceEnabled;

  @SuppressWarnings("unchecked")
  public void validarAlumnoYVinculo(Long alumnoId, Long solicitanteId) {
    if (!interserviceEnabled || alumnoId == null) {
      return;
    }
    try {
      Map<String, Object> alumno =
          restTemplate.getForObject(usuariosBaseUrl + "/api/usuarios/" + alumnoId, Map.class);
      if (alumno != null) {
        if (!"ALUMNO".equals(String.valueOf(alumno.get("rol")).replace("ROLE_", "")))
          throw new IllegalArgumentException("El usuario indicado no es alumno");
        if ("INACTIVA".equals(String.valueOf(alumno.get("estado")))
            || Boolean.FALSE.equals(alumno.get("activo"))) {
          throw new IllegalStateException(
              "El alumno se encuentra inactivo y no puede realizar operaciones.");
        }
      }
      if (solicitanteId != null && !solicitanteId.equals(alumnoId)) {
        Map<String, Object> solicitante =
            restTemplate.getForObject(
                usuariosBaseUrl + "/api/usuarios/" + solicitanteId, Map.class);
        if (solicitante != null
            && ("ROLE_APODERADO".equals(String.valueOf(solicitante.get("rol")))
                || "APODERADO".equals(String.valueOf(solicitante.get("rol"))))) {
          List<Map<String, Object>> pupilos =
              restTemplate.getForObject(
                  usuariosBaseUrl + "/api/usuarios/apoderados/" + solicitanteId + "/alumnos",
                  List.class);
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
            throw new IllegalStateException(
                "El apoderado no tiene un vínculo activo con el alumno solicitado.");
          }
        }
      }
    } catch (HttpClientErrorException.NotFound e) {
      throw new IllegalArgumentException("El alumno ID " + alumnoId + " no existe en MS Usuarios.");
    } catch (ResourceAccessException ignored) {
      throw new IllegalStateException("Servicio requerido no disponible", ignored);
    } catch (IllegalStateException | IllegalArgumentException e) {
      throw e;
    } catch (Exception ignored) {
      throw new IllegalStateException("Falló la operación entre servicios", ignored);
    }
  }

  @SuppressWarnings("unchecked")
  public void validarAutonomiaReserva(Long alumnoId, Long creadaPorId) {
    if (!interserviceEnabled || alumnoId == null || !alumnoId.equals(creadaPorId)) {
      return;
    }
    try {
      Map<String, Object> resp =
          restTemplate.getForObject(
              usuariosBaseUrl + "/api/usuarios/alumnos/" + alumnoId + "/puede-reservar", Map.class);
      if (resp != null && Boolean.FALSE.equals(resp.get("puedeReservar"))) {
        throw new IllegalStateException(
            "El alumno menor de 12 años no está habilitado para confirmar reservas por sí mismo.");
      }
    } catch (ResourceAccessException ignored) {
      throw new IllegalStateException("Servicio requerido no disponible", ignored);
    } catch (IllegalStateException e) {
      throw e;
    } catch (Exception ignored) {
      throw new IllegalStateException("Falló la operación entre servicios", ignored);
    }
  }

  @SuppressWarnings("unchecked")
  public List<String> correosApoderados(Long alumnoId) {
    if (!interserviceEnabled) return java.util.List.of();
    List<Map<String, Object>> vinculados =
        restTemplate.getForObject(
            usuariosBaseUrl + "/api/usuarios/alumnos/" + alumnoId + "/apoderados", List.class);
    if (vinculados == null)
      throw new IllegalStateException("No fue posible consultar destinatarios");
    return vinculados.stream()
        .filter(v -> !Boolean.FALSE.equals(v.get("activo")) && !"INACTIVA".equals(v.get("estado")))
        .map(v -> v.get("correo"))
        .filter(java.util.Objects::nonNull)
        .map(Object::toString)
        .filter(v -> !v.isBlank())
        .distinct()
        .toList();
  }

  @SuppressWarnings("unchecked")
  public boolean puedeConsultarAlumno(Long alumnoId) {
    Long usuario = cl.edusaldo.ventas.config.ContextoSolicitud.usuario(null);
    if ("ALUMNO".equals(cl.edusaldo.ventas.config.ContextoSolicitud.rol()))
      return alumnoId.equals(usuario);
    if (!"APODERADO".equals(cl.edusaldo.ventas.config.ContextoSolicitud.rol())) return false;
    List<Map<String, Object>> vinculados =
        restTemplate.getForObject(
            usuariosBaseUrl + "/api/usuarios/apoderados/" + usuario + "/alumnos", List.class);
    return vinculados != null
        && vinculados.stream()
            .anyMatch(
                v ->
                    alumnoId
                            .toString()
                            .equals(
                                String.valueOf(
                                    v.get("id") != null ? v.get("id") : v.get("alumnoId")))
                        && !Boolean.FALSE.equals(v.get("activo")));
  }
}
