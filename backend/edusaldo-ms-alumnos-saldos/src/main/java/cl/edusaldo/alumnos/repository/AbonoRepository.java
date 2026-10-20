package cl.edusaldo.alumnos.repository;

import cl.edusaldo.alumnos.model.Abono;
import cl.edusaldo.alumnos.model.EstadoAbono;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AbonoRepository extends JpaRepository<Abono, Long> {
    @Query("SELECT a FROM Abono a WHERE a.claveOperacion = :tokenTransaccion")
    Optional<Abono> findByTokenTransaccion(@Param("tokenTransaccion") String tokenTransaccion);

    List<Abono> findByAlumnoId(Long alumnoId);
    List<Abono> findByEstado(EstadoAbono estado);
}
