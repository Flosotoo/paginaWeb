package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.AlertaSaldoBajo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AlertaSaldoBajoRepository extends JpaRepository<AlertaSaldoBajo, Long> {
    @Query("SELECT a FROM AlertaSaldoBajo a WHERE a.cuentaSaldoId = :cuentaSaldoId")
    Optional<AlertaSaldoBajo> findByCuentaSaldoId(@Param("cuentaSaldoId") Long cuentaSaldoId);
}
