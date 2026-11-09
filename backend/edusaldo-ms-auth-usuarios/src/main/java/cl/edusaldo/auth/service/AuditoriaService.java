package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.RegistroAuditoria;
import cl.edusaldo.auth.repository.RegistroAuditoriaRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditoriaService {

  @org.springframework.beans.factory.annotation.Autowired(required = false)
  private cl.edusaldo.auth.repository.UsuarioRepository usuarioRepository;

  private final RegistroAuditoriaRepository auditoriaRepository;

  public AuditoriaService(RegistroAuditoriaRepository auditoriaRepository) {
    this.auditoriaRepository = auditoriaRepository;
  }

  @Transactional
  public RegistroAuditoria registrar(
      Long usuarioId, String accion, String entidad, String entidadId, String detalle) {
    if (TenantContext.actor() != null) usuarioId = TenantContext.actor();
    RegistroAuditoria reg = new RegistroAuditoria(usuarioId, accion, entidad, entidadId, detalle);
    reg.setIdEstablecimiento(TenantContext.current());
    if (usuarioRepository != null && usuarioId != null)
      usuarioRepository
          .findById(usuarioId)
          .ifPresent(u -> reg.setIdEstablecimiento(u.getIdEstablecimiento()));
    return auditoriaRepository.save(reg);
  }

  @Transactional(readOnly = true)
  public List<RegistroAuditoria> listarTodas() {
    return auditoriaRepository.findByIdEstablecimientoOrderByFechaHoraDesc(TenantContext.current());
  }

  @Transactional(readOnly = true)
  public List<RegistroAuditoria> listarPorUsuario(Long usuarioId) {
    return auditoriaRepository.findByIdEstablecimientoAndUsuarioIdOrderByFechaHoraDesc(
        TenantContext.current(), usuarioId);
  }

  @Transactional(readOnly = true)
  public List<RegistroAuditoria> listarPorEntidad(String entidad) {
    return auditoriaRepository.findByIdEstablecimientoAndEntidadOrderByFechaHoraDesc(
        TenantContext.current(), entidad);
  }
}
