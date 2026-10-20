package cl.edusaldo.productos.repository;

import cl.edusaldo.productos.model.ReservaStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ReservaStockRepository extends JpaRepository<ReservaStock, Long> {
    Optional<ReservaStock> findByReservaId(Long reservaId);
}
