package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.EstadoCuenta;
import cl.edusaldo.auth.model.Usuario;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
  List<Usuario> findByIdEstablecimiento(Long idEstablecimiento);

  Optional<Usuario> findByRut(String rut);

  Optional<Usuario> findByCorreo(String correo);

  boolean existsByRut(String rut);

  boolean existsByCorreo(String correo);

  List<Usuario> findByEstado(EstadoCuenta estado);
}
