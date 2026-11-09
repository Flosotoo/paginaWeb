package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.ReservaStock;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReservaStockRepository extends JpaRepository<ReservaStock, Long> {
  java.util.Optional<ReservaStock> findByIdAndIdEstablecimiento(Long id, Long idEstablecimiento);

  java.util.List<ReservaStock> findAllByIdEstablecimiento(Long idEstablecimiento);

  Optional<ReservaStock> findByReservaIdAndIdEstablecimiento(
      Long reservaId, Long idEstablecimiento);

  Optional<ReservaStock> findByReservaId(Long reservaId);
}
