package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.OperacionDistribuida;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OperacionDistribuidaRepository extends JpaRepository<OperacionDistribuida, Long> {

  Optional<OperacionDistribuida> findByIdAndIdEstablecimiento(Long id, Long tenant);

  java.util.List<OperacionDistribuida> findByIdEstablecimientoOrderByIdDesc(Long tenant);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query(
      "select o from OperacionDistribuida o where o.id=:id and o.idEstablecimiento=:tenant")
  Optional<OperacionDistribuida> bloquear(
      @org.springframework.data.repository.query.Param("id") Long id,
      @org.springframework.data.repository.query.Param("tenant") Long tenant);
}
