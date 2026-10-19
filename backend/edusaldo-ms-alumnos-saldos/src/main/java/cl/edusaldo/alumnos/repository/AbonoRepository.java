package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.Abono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbonoRepository extends JpaRepository<Abono, Long> {
    Optional<Abono> findByTokenTransaccion(String tokenTransaccion);
    List<Abono> findByAlumnoId(Long alumnoId);
}
