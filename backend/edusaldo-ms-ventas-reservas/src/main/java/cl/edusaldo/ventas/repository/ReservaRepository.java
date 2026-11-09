package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.Reserva;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {
  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "detalles")
  Optional<Reserva> findByIdAndIdEstablecimiento(Long id, Long tenant);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "detalles")
  List<Reserva> findByIdEstablecimientoOrderByIdDesc(Long tenant);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query(
      "select e from Reserva e where e.id=:id and e.idEstablecimiento=:tenant")
  Optional<Reserva> bloquear(
      @org.springframework.data.repository.query.Param("id") Long id,
      @org.springframework.data.repository.query.Param("tenant") Long tenant);
}
