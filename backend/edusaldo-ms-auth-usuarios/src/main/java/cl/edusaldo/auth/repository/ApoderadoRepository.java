package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Apoderado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ApoderadoRepository extends JpaRepository<Apoderado, Long> {
    Optional<Apoderado> findByRut(String rut);
    Optional<Apoderado> findByCorreo(String correo);
    boolean existsByRut(String rut);
}
