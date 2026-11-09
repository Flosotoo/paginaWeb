package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Alumno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlumnoRepository extends JpaRepository<Alumno, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  @org.springframework.data.jpa.repository.Query("select a from Alumno a where a.id = :id and a.idEstablecimiento = :tenant")
  Optional<Alumno> bloquear(@org.springframework.data.repository.query.Param("id") Long id,
      @org.springframework.data.repository.query.Param("tenant") Long tenant);
  Optional<Alumno> findByRut(String rut);
    Optional<Alumno> findByCorreo(String correo);
    boolean existsByRut(String rut);
    List<Alumno> findByCurso(String curso);
}
