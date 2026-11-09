package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.ConsentimientoDTO;
import cl.edusaldo.auth.model.ConsentimientoPrivacidad;
import cl.edusaldo.auth.repository.ConsentimientoPrivacidadRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsentimientoService {

  @org.springframework.beans.factory.annotation.Autowired
  private cl.edusaldo.auth.repository.UsuarioRepository usuarios;

  private void validar(Long usuarioId, boolean escritura) {
    var u =
        usuarios
            .findById(usuarioId)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
    TenantContext.requireTenant(u.getIdEstablecimiento());
    if (escritura || !"ADMINISTRADOR".equals(TenantContext.role()))
      TenantContext.requireOwn(usuarioId);
  }

  private final ConsentimientoPrivacidadRepository consentimientoRepository;
  private final AuditoriaService auditoriaService;

  public ConsentimientoService(
      ConsentimientoPrivacidadRepository consentimientoRepository,
      AuditoriaService auditoriaService) {
    this.consentimientoRepository = consentimientoRepository;
    this.auditoriaService = auditoriaService;
  }

  @Transactional
  public ConsentimientoPrivacidad registrarConsentimiento(ConsentimientoDTO dto) {
    validar(dto.getUsuarioId(), true);
    ConsentimientoPrivacidad c =
        new ConsentimientoPrivacidad(dto.getUsuarioId(), dto.getVersionAviso(), dto.getIpOrigen());
    ConsentimientoPrivacidad guardado = consentimientoRepository.save(c);

    auditoriaService.registrar(
        dto.getUsuarioId(),
        "ACEPTAR_CONSENTIMIENTO",
        "ConsentimientoPrivacidad",
        guardado.getId().toString(),
        "Versión aviso aceptada: " + dto.getVersionAviso());
    return guardado;
  }

  @Transactional(readOnly = true)
  public List<ConsentimientoPrivacidad> listarPorUsuario(Long usuarioId) {
    validar(usuarioId, false);
    return consentimientoRepository.findByUsuarioId(usuarioId);
  }

  @Transactional(readOnly = true)
  public Optional<ConsentimientoPrivacidad> obtenerUltimoConsentimiento(Long usuarioId) {
    return consentimientoRepository.findFirstByUsuarioIdOrderByFechaAceptacionDesc(usuarioId);
  }
}
