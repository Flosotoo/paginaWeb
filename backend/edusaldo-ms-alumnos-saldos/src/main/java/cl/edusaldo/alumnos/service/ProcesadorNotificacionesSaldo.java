package cl.edusaldo.alumnos.service;

import cl.edusaldo.alumnos.client.UsuariosSaldosClient;
import cl.edusaldo.alumnos.config.RequestContext;
import cl.edusaldo.alumnos.repository.NotificacionSaldoPendienteRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class ProcesadorNotificacionesSaldo {
  private final NotificacionSaldoPendienteRepository notificaciones;
  private final UsuariosSaldosClient usuarios;
  private final TransactionTemplate transacciones;
  private final ObjectMapper json;

  public ProcesadorNotificacionesSaldo(NotificacionSaldoPendienteRepository notificaciones,
      UsuariosSaldosClient usuarios, org.springframework.transaction.PlatformTransactionManager tx,
      ObjectMapper json) {
    this.notificaciones = notificaciones;
    this.usuarios = usuarios;
    this.transacciones = new TransactionTemplate(tx);
    this.json = json;
  }

  @Scheduled(initialDelayString = "${edusaldo.notificaciones.demora-inicial-ms:60000}",
      fixedDelayString = "${edusaldo.notificaciones.intervalo-ms:30000}")
  public void procesarPendientes() {
    for (Long id : notificaciones.pendientes(LocalDateTime.now(), PageRequest.of(0, 100))) {
      try {
        procesar(id);
      } catch (RuntimeException ex) {
        org.slf4j.LoggerFactory.getLogger(getClass()).warn("No se pudo procesar la notificación {}", id, ex);
      }
    }
  }

  public void procesar(Long id) {
    transacciones.executeWithoutResult(status -> notificaciones.bloquear(id).ifPresent(n -> {
      if (!"PENDIENTE".equals(n.getEstado()) ||
          (n.getSiguienteIntento() != null && n.getSiguienteIntento().isAfter(LocalDateTime.now()))) return;
      Long tenant = n.getAlertaSaldoBajo().getCuentaSaldo().getIdEstablecimiento();
      RequestContext anterior;
      try { anterior = RequestContext.current(); } catch (SecurityException ex) { anterior = null; }
      try {
        RequestContext.set(new RequestContext(tenant, null, null, "saldos", 0));
        List<Map<String, Object>> destinatarios = usuarios.apoderadosDeAlumno(n.getAlumnoId()).stream()
            .filter(a -> !Boolean.FALSE.equals(a.get("activo")))
            .filter(a -> !"INACTIVO".equals(a.get("estado")) && !"INACTIVA".equals(a.get("estado")))
            .map(a -> destinatario(a, tenant)).toList();
        if (destinatarios.isEmpty()) throw new IllegalStateException("Sin apoderados activos");
        n.marcarSimulada("El saldo disponible del alumno está bajo el umbral configurado.",
            json.writeValueAsString(destinatarios));
      } catch (RuntimeException | JsonProcessingException ex) {
        org.slf4j.LoggerFactory.getLogger(getClass()).warn(
            "Falló la preparación de la notificación {}: {}", id, ex.getMessage());
        n.registrarFallo();
      } finally {
        if (anterior == null) RequestContext.clear(); else RequestContext.set(anterior);
      }
    }));
  }

  private Map<String, Object> destinatario(Map<String, Object> a, Long tenant) {
    if (!(a.get("id") instanceof Number id) || id.longValue() <= 0)
      throw new IllegalStateException("Identificador de apoderado inválido");
    if (!(a.get("idEstablecimiento") instanceof Number establecimiento)
        || establecimiento.longValue() != tenant)
      throw new IllegalStateException("Establecimiento del apoderado inválido");
    Map<String, Object> resultado = new LinkedHashMap<>();
    resultado.put("id", id.longValue());
    if (a.get("nombreCompleto") != null) resultado.put("nombre", a.get("nombreCompleto"));
    if (a.get("correo") != null) resultado.put("correo", a.get("correo"));
    return resultado;
  }
}
