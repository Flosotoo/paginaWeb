package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.TransferenciaBancaria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TransferenciaBancariaRepository extends JpaRepository<TransferenciaBancaria, Long> {
    @Query("SELECT t FROM TransferenciaBancaria t WHERE t.abonoId = :abonoId")
    Optional<TransferenciaBancaria> findByAbonoId(@Param("abonoId") Long abonoId);
}
