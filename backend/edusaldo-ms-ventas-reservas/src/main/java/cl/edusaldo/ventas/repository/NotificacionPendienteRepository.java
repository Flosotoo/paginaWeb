package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.NotificacionPendiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionPendienteRepository extends JpaRepository<NotificacionPendiente, Long> {
    List<NotificacionPendiente> findByAlumnoIdOrderByFechaCreacionDesc(Long alumnoId);
    List<NotificacionPendiente> findAllByOrderByFechaCreacionDesc();
}
