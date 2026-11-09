package cl.edusaldo.alumnos.client;

import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.exception.ServicioUsuariosNoDisponibleException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class UsuariosSaldosClient {
  private final RestTemplate restTemplate = internalTemplate();

  @Value("${edusaldo.interservice.enabled:true}")
  private boolean interserviceEnabled = true;

  @Value("${edusaldo.services.usuarios-url:http://localhost:8091}")
  private String usuariosBaseUrl = "http://localhost:8091";

  private static RestTemplate internalTemplate() {
    RestTemplate client = new RestTemplate();
    var factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(3000);
    factory.setReadTimeout(5000);
    client.setRequestFactory(factory);
    client
        .getInterceptors()
        .add(
            (request, body, execution) -> {
              String key = System.getenv("EDUSALDO_INTERNAL_KEY");
              if (key != null) request.getHeaders().set("X-Internal-Key", key);
              RequestContext context = RequestContext.current();
              request.getHeaders().set("X-Internal-Caller", "saldos");
              request
                  .getHeaders()
                  .set("X-Establecimiento-Id", context.establecimiento().toString());
              if (context.usuario() != null)
                request.getHeaders().set("X-Usuario-Id", context.usuario().toString());
              if (context.rol() != null) request.getHeaders().set("X-Rol", context.rol());
              request
                  .getHeaders()
                  .set("X-Umbral-Saldo-Bajo", Integer.toString(context.umbralSaldoBajo()));
              return execution.execute(request, body);
            });
    return client;
  }

  public void validarAlumnoYVinculo(Long alumnoId, Long apoderadoId) {
    if (!interserviceEnabled) return;
    Map<?, ?> alumno = usuario(alumnoId);
    if (!"ALUMNO".equals(rol(alumno)))
      throw new IllegalArgumentException("El usuario debe ser alumno");
    if ("INACTIVA".equals(alumno.get("estado"))
        || "INACTIVO".equals(alumno.get("estado"))
        || Boolean.FALSE.equals(alumno.get("activo")))
      throw new IllegalStateException("Alumno inactivo");
    if (apoderadoId != null && !esApoderadoVinculado(alumnoId, apoderadoId))
      throw new SecurityException("Apoderado sin vínculo activo con el alumno");
  }

  private static String rol(Map<?, ?> usuario) {
    return String.valueOf(usuario.get("rol")).replace("ROLE_", "");
  }

  private Map<?, ?> usuario(Long id) {
    if (id == null) throw new IllegalArgumentException("Usuario obligatorio");
    Map<?, ?> usuario =
        restTemplate.getForObject(usuariosBaseUrl + "/api/usuarios/" + id, Map.class);
    if (usuario == null || !(usuario.get("idEstablecimiento") instanceof Number tenant))
      throw new IllegalStateException("No se pudo determinar el establecimiento del usuario");
    RequestContext.checkTenant(tenant.longValue());
    return usuario;
  }

  public Long establecimientoAlumno(Long alumnoId) {
    if (!interserviceEnabled) return RequestContext.tenant();
    return ((Number) usuario(alumnoId).get("idEstablecimiento")).longValue();
  }

  public boolean esApoderadoVinculado(Long alumnoId, Long apoderadoId) {
    return apoderadosDeAlumno(alumnoId).stream()
        .anyMatch(
            a -> {
              Object id = a.get("id") != null ? a.get("id") : a.get("apoderadoId");
              return id != null
                  && apoderadoId.equals(Long.valueOf(id.toString()))
                  && !Boolean.FALSE.equals(a.get("activo"))
                  && !"INACTIVA".equals(a.get("estado"))
                  && !"INACTIVO".equals(a.get("estado"));
            });
  }

  public Set<Long> alumnosVinculados(Long apoderadoId) {
    return consultarLista("/api/usuarios/apoderados/" + apoderadoId + "/alumnos").stream()
        .map(
            alumno -> {
              Object id = alumno.get("id");
              if (!(id instanceof Number number) || number.longValue() <= 0)
                throw new ServicioUsuariosNoDisponibleException();
              return number.longValue();
            })
        .collect(Collectors.toUnmodifiableSet());
  }

  @SuppressWarnings("unchecked")
  public List<Map<String, Object>> apoderadosDeAlumno(Long alumnoId) {
    return consultarLista("/api/usuarios/alumnos/" + alumnoId + "/apoderados");
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> consultarLista(String path) {
    if (!interserviceEnabled) throw new ServicioUsuariosNoDisponibleException();
    try {
      List<?> resultado = restTemplate.getForObject(usuariosBaseUrl + path, List.class);
      if (resultado == null || resultado.stream().anyMatch(item -> !(item instanceof Map)))
        throw new ServicioUsuariosNoDisponibleException();
      return (List<Map<String, Object>>) (List<?>) resultado;
    } catch (org.springframework.web.client.RestClientException ex) {
      throw new ServicioUsuariosNoDisponibleException(ex);
    }
  }
}
