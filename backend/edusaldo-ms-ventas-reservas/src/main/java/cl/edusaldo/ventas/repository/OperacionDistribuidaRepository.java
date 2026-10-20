package cl.edusaldo.ventas.repository;

import cl.edusaldo.ventas.model.OperacionDistribuida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OperacionDistribuidaRepository extends JpaRepository<OperacionDistribuida, Long> {
    Optional<OperacionDistribuida> findByClaveIdempotencia(String claveIdempotencia);
}
