package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CorreoSimuladoService {
  private final CorreoSimuladoRepository correos;
  private final ConfiguracionInstitucionalRepository colegios;

  public CorreoSimuladoService(
      CorreoSimuladoRepository correos, ConfiguracionInstitucionalRepository colegios) {
    this.correos = correos;
    this.colegios = colegios;
  }

  @Transactional
  public void registrar(Usuario usuario, String tipo, String contenido) {
    correos.save(
        new CorreoSimulado(
            usuario, colegios.getReferenceById(usuario.getIdEstablecimiento()), tipo, contenido));
  }

  @Transactional(readOnly = true)
  public List<CorreoSimulado> listar() {
    if (TenantContext.actor() == null)
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.UNAUTHORIZED, "Sesión requerida");
    return "ADMINISTRADOR".equals(TenantContext.role())
        ? correos.findByEstablecimiento_IdOrderByFechaCreacionDesc(TenantContext.current())
        : correos.findByEstablecimiento_IdAndUsuario_IdOrderByFechaCreacionDesc(
            TenantContext.current(), TenantContext.actor());
  }
}
