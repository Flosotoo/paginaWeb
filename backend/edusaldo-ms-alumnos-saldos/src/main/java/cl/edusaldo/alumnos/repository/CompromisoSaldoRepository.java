package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.CompromisoSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CompromisoSaldoRepository extends JpaRepository<CompromisoSaldo, Long> {
    @Query("SELECT c FROM CompromisoSaldo c WHERE c.cuentaSaldoId = :cuentaSaldoId AND c.reservaId = :reservaId")
    List<CompromisoSaldo> findByCuentaAndReserva(@Param("cuentaSaldoId") Long cuentaSaldoId, @Param("reservaId") Long reservaId);
}
