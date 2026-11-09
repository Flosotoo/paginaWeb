package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ApoderadoAlumno;
import cl.edusaldo.auth.model.ApoderadoAlumnoId;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApoderadoAlumnoRepository
    extends JpaRepository<ApoderadoAlumno, ApoderadoAlumnoId> {
  // Both reads must be current; looking up each tutor by PK also avoids locking unrelated pupils.
  @org.springframework.data.jpa.repository.Query(
      value =
          "select v.apoderado_id from apoderado_alumnos v"
              + " where v.alumno_id = :alumnoId and v.activo = true and exists"
              + " (select 1 from usuarios a where a.id = v.apoderado_id"
              + " and a.id_establecimiento = :tenant and a.tipo_usuario = 'APODERADO'"
              + " and a.estado <> 'INACTIVA' for update) order by v.apoderado_id for update",
      nativeQuery = true)
  List<Long> bloquearApoderadosHabilitados(
      @org.springframework.data.repository.query.Param("alumnoId") Long alumnoId,
      @org.springframework.data.repository.query.Param("tenant") Long tenant);

  List<ApoderadoAlumno> findByIdApoderadoId(Long apoderadoId);

  List<ApoderadoAlumno> findByIdAlumnoId(Long alumnoId);

  Optional<ApoderadoAlumno> findByIdApoderadoIdAndIdAlumnoId(Long apoderadoId, Long alumnoId);

  void deleteByIdApoderadoIdAndIdAlumnoId(Long apoderadoId, Long alumnoId);

  long countByIdAlumnoId(Long alumnoId);

  long countByIdAlumnoIdAndActivoTrue(Long alumnoId);
}
