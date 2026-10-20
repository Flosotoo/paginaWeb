package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.MovimientoSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovimientoSaldoRepository extends JpaRepository<MovimientoSaldo, Long> {
    @Query("SELECT m FROM MovimientoSaldo m WHERE m.cuentaSaldo.id = :cuentaSaldoId ORDER BY m.fecha DESC")
    List<MovimientoSaldo> findByCuentaSaldoIdOrderByFechaDesc(@Param("cuentaSaldoId") Long cuentaSaldoId);

    Optional<MovimientoSaldo> findByIdempotencyKey(String idempotencyKey);
    boolean existsByIdempotencyKey(String idempotencyKey);
}
