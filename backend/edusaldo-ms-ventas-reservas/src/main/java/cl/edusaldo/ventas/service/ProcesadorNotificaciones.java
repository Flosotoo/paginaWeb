package cl.edusaldo.ventas.service;

import cl.edusaldo.ventas.config.ContextoSolicitud;
import cl.edusaldo.ventas.repository.NotificacionPendienteRepository;
import java.time.LocalDateTime;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProcesadorNotificaciones {
  private static final Logger log = LoggerFactory.getLogger(ProcesadorNotificaciones.class);
  private final NotificacionPendienteRepository notificaciones;
  private final OperacionService operaciones;
  private final boolean habilitado;

  public ProcesadorNotificaciones(
      NotificacionPendienteRepository notificaciones,
      OperacionService operaciones,
      @Value("${edusaldo.notificaciones.asincronas.enabled:true}") boolean habilitado) {
    this.notificaciones = notificaciones;
    this.operaciones = operaciones;
    this.habilitado = habilitado;
  }

  @Scheduled(
      fixedDelayString = "${edusaldo.notificaciones.intervalo-ms:5000}",
      initialDelayString = "${edusaldo.notificaciones.intervalo-ms:5000}")
  public void ejecutarAutomaticamente() {
    if (habilitado) procesarPendientes();
  }

  public void procesarPendientes() {
    var pendientes = notificaciones.pendientes(LocalDateTime.now(), PageRequest.of(0, 50));
    for (var notificacion : pendientes) {
      try (var contexto =
          ContextoSolicitud.interno(
              Map.of("X-Establecimiento-Id", notificacion.getIdEstablecimiento().toString()))) {
        operaciones.resolverNotificacion(notificacion.getId());
      } catch (RuntimeException error) {
        log.warn(
            "No se pudo resolver la notificación {}: {}",
            notificacion.getId(),
            error.getClass().getSimpleName());
      }
    }
  }
}
