package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Alumno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlumnoRepository extends JpaRepository<Alumno, Long> {
    Optional<Alumno> findByRut(String rut);
    Optional<Alumno> findByCorreo(String correo);
    boolean existsByRut(String rut);
    List<Alumno> findByCurso(String curso);
}
