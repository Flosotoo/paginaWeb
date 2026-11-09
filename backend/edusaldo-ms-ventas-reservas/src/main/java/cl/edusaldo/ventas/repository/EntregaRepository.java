package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.Entrega;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EntregaRepository extends JpaRepository<Entrega, Long> {
  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "detalles")
  Optional<Entrega> findByIdAndIdEstablecimiento(Long id, Long tenant);

  @org.springframework.data.jpa.repository.EntityGraph(attributePaths = "detalles")
  List<Entrega> findByIdEstablecimientoOrderByIdDesc(Long tenant);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query(
      "select e from Entrega e where e.id=:id and e.idEstablecimiento=:tenant")
  Optional<Entrega> bloquear(
      @org.springframework.data.repository.query.Param("id") Long id,
      @org.springframework.data.repository.query.Param("tenant") Long tenant);
}
