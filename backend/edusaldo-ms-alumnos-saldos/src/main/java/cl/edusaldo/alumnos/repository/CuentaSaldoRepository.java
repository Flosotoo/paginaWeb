package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.CuentaSaldo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CuentaSaldoRepository extends JpaRepository<CuentaSaldo, Long> {
    Optional<CuentaSaldo> findByAlumnoId(Long alumnoId);
}
