package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ApoderadoAlumno;
import cl.edusaldo.auth.model.ApoderadoAlumnoId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApoderadoAlumnoRepository extends JpaRepository<ApoderadoAlumno, ApoderadoAlumnoId> {
    List<ApoderadoAlumno> findByIdApoderadoId(Long apoderadoId);
    List<ApoderadoAlumno> findByIdAlumnoId(Long alumnoId);
    Optional<ApoderadoAlumno> findByIdApoderadoIdAndIdAlumnoId(Long apoderadoId, Long alumnoId);
    void deleteByIdApoderadoIdAndIdAlumnoId(Long apoderadoId, Long alumnoId);
    long countByIdAlumnoId(Long alumnoId);
}
