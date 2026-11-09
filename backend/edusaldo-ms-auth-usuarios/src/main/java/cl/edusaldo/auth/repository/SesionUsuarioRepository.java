package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.SesionUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SesionUsuarioRepository extends JpaRepository<SesionUsuario, String> {
  java.util.List<SesionUsuario> findByUsuarioId(Long usuarioId);
}
