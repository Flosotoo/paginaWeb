package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.ConsentimientoPrivacidad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentimientoPrivacidadRepository extends JpaRepository<ConsentimientoPrivacidad, Long> {
    List<ConsentimientoPrivacidad> findByUsuarioId(Long usuarioId);
    Optional<ConsentimientoPrivacidad> findFirstByUsuarioIdOrderByFechaAceptacionDesc(Long usuarioId);
}
