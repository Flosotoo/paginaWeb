package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.CorreoSimulado;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CorreoSimuladoRepository extends JpaRepository<CorreoSimulado, Long> {
  List<CorreoSimulado> findByEstablecimiento_IdOrderByFechaCreacionDesc(Long tenant);

  List<CorreoSimulado> findByEstablecimiento_IdAndUsuario_IdOrderByFechaCreacionDesc(
      Long tenant, Long usuarioId);
}
