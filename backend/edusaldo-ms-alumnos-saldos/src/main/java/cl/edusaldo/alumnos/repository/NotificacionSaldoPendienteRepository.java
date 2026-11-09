package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.NotificacionSaldoPendiente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificacionSaldoPendienteRepository
    extends JpaRepository<NotificacionSaldoPendiente, Long> {
  @org.springframework.data.jpa.repository.Query(
      "SELECT n.id FROM NotificacionSaldoPendiente n WHERE n.estado = 'PENDIENTE'"
          + " AND (n.siguienteIntento IS NULL OR n.siguienteIntento <= :ahora) ORDER BY n.id")
  java.util.List<Long> pendientes(java.time.LocalDateTime ahora, org.springframework.data.domain.Pageable pagina);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("SELECT n FROM NotificacionSaldoPendiente n WHERE n.id = :id")
  java.util.Optional<NotificacionSaldoPendiente> bloquear(Long id);

  @org.springframework.data.jpa.repository.Query(
      "SELECT n FROM NotificacionSaldoPendiente n JOIN n.alertaSaldoBajo a JOIN a.cuentaSaldo c"
          + " WHERE c.idEstablecimiento = :establecimiento")
  java.util.List<NotificacionSaldoPendiente> buscarPorEstablecimiento(
      @org.springframework.data.repository.query.Param("establecimiento") Long establecimiento);
}
