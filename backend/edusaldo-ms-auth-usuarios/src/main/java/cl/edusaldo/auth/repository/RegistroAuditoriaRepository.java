package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.RegistroAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroAuditoriaRepository extends JpaRepository<RegistroAuditoria, Long> {
    List<RegistroAuditoria> findAllByOrderByFechaHoraDesc();
    List<RegistroAuditoria> findByUsuarioIdOrderByFechaHoraDesc(Long usuarioId);
    List<RegistroAuditoria> findByEntidadOrderByFechaHoraDesc(String entidad);
}
