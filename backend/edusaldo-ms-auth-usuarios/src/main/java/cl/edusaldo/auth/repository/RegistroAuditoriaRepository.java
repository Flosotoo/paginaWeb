package cl.edusaldo.auth.repository;

import cl.edusaldo.auth.model.RegistroAuditoria;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistroAuditoriaRepository extends JpaRepository<RegistroAuditoria, Long> {
  List<RegistroAuditoria> findByIdEstablecimientoOrderByFechaHoraDesc(Long tenant);

  List<RegistroAuditoria> findByIdEstablecimientoAndUsuarioIdOrderByFechaHoraDesc(
      Long tenant, Long usuarioId);

  List<RegistroAuditoria> findByIdEstablecimientoAndEntidadOrderByFechaHoraDesc(
      Long tenant, String entidad);

  List<RegistroAuditoria> findByUsuarioIdOrderByFechaHoraDesc(Long usuarioId);

  List<RegistroAuditoria> findByEntidadOrderByFechaHoraDesc(String entidad);
}
