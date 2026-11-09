package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.MovimientoSaldo;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimientoSaldoRepository extends JpaRepository<MovimientoSaldo, Long> {
  @Query(
      "SELECT m FROM MovimientoSaldo m WHERE m.cuentaSaldo.id = :cuentaSaldoId ORDER BY m.fecha"
          + " DESC")
  List<MovimientoSaldo> findByCuentaSaldoIdOrderByFechaDesc(
      @Param("cuentaSaldoId") Long cuentaSaldoId);

  @Query(
      "SELECT m FROM MovimientoSaldo m WHERE m.cuentaSaldo.idEstablecimiento = :establecimiento AND"
          + " m.fecha >= :desde AND m.fecha < :hasta ORDER BY m.fecha DESC")
  List<MovimientoSaldo> buscarPeriodo(
      @Param("establecimiento") Long establecimiento,
      @Param("desde") java.time.LocalDateTime desde,
      @Param("hasta") java.time.LocalDateTime hasta);

  Optional<MovimientoSaldo> findByReferenciaUnica(String referenciaUnica);

  boolean existsByReferenciaUnica(String referenciaUnica);
}
