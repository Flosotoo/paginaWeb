package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Encargado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EncargadoRepository extends JpaRepository<Encargado, Long> {
    Optional<Encargado> findByRut(String rut);
    Optional<Encargado> findByCorreo(String correo);
}
