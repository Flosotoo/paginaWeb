package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.Administrador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdministradorRepository extends JpaRepository<Administrador, Long> {
    Optional<Administrador> findByRut(String rut);
    Optional<Administrador> findByCorreo(String correo);
}
