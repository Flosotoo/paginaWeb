package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.NotificacionPendiente;
import jakarta.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacionPendienteRepository
    extends JpaRepository<NotificacionPendiente, Long> {
  List<NotificacionPendiente> findByIdEstablecimientoOrderByFechaCreacionDesc(Long tenant);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select n from NotificacionPendiente n where n.id = :id and n.idEstablecimiento = :tenant")
  Optional<NotificacionPendiente> bloquear(@Param("id") Long id, @Param("tenant") Long tenant);

  @Query(
      "select n from NotificacionPendiente n where n.estado = 'PENDIENTE' and (n.siguienteIntento"
          + " is null or n.siguienteIntento <= :ahora) order by n.fechaCreacion")
  List<NotificacionPendiente> pendientes(@Param("ahora") LocalDateTime ahora, Pageable pagina);
}
