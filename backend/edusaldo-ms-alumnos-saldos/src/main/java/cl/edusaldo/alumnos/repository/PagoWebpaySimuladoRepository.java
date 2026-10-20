package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.PagoWebpaySimulado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PagoWebpaySimuladoRepository extends JpaRepository<PagoWebpaySimulado, Long> {
    @Query("SELECT p FROM PagoWebpaySimulado p WHERE p.abonoId = :abonoId")
    Optional<PagoWebpaySimulado> findByAbonoId(@Param("abonoId") Long abonoId);

    @Query("SELECT p FROM PagoWebpaySimulado p WHERE p.referenciaPago = :referenciaPago")
    Optional<PagoWebpaySimulado> findByReferenciaPago(@Param("referenciaPago") String referenciaPago);
}
