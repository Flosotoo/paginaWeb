package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.NotificacionSaldoPendiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacionSaldoPendienteRepository extends JpaRepository<NotificacionSaldoPendiente, Long> {
}
