package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.MovimientoSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovimientoSaldoRepository extends JpaRepository<MovimientoSaldo, Long> {
    List<MovimientoSaldo> findByCuentaSaldoIdOrderByFechaDesc(Long cuentaSaldoId);
    Optional<MovimientoSaldo> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
