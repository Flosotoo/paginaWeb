package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.PoliticaAccesoDTO;
import cl.edusaldo.auth.model.PoliticaAcceso;
import cl.edusaldo.auth.model.Usuario;
import cl.edusaldo.auth.repository.PoliticaAccesoRepository;
import cl.edusaldo.auth.repository.UsuarioRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PoliticaAccesoService {

  private final PoliticaAccesoRepository politicaAccesoRepository;
  private final AuditoriaService auditoriaService;

  @Autowired(required = false)
  private UsuarioRepository usuarioRepository;

  public PoliticaAccesoService(
      PoliticaAccesoRepository politicaAccesoRepository, AuditoriaService auditoriaService) {
    this.politicaAccesoRepository = politicaAccesoRepository;
    this.auditoriaService = auditoriaService;
  }

  @Transactional(readOnly = true)
  public PoliticaAcceso obtenerPolitica() {
    return politicaAccesoRepository
        .findByIdEstablecimiento(TenantContext.current())
        .orElseGet(() -> politicaPorDefecto());
  }

  @Transactional
  public PoliticaAcceso modificarPolitica(PoliticaAccesoDTO dto, Long adminId) {
    PoliticaAcceso p =
        politicaAccesoRepository
            .findByIdEstablecimiento(TenantContext.current())
            .orElseGet(() -> politicaPorDefecto());
    p.modificar(
        dto.getMaxIntentosFallidos(),
        dto.getMinutosBloqueo(),
        dto.getEdadMinimaAlumno(),
        dto.getUmbralSaldoBajoClp());
    PoliticaAcceso guardada = politicaAccesoRepository.save(p);
    auditoriaService.registrar(
        TenantContext.actor(),
        "MODIFICAR_POLITICA_ACCESO",
        "PoliticaAcceso",
        guardada.getId().toString(),
        "Max intentos: "
            + guardada.getMaxIntentosFallidos()
            + ", Min bloqueo: "
            + guardada.getMinutosBloqueo());
    return guardada;
  }

  @Transactional(readOnly = true, noRollbackFor = IllegalStateException.class)
  public void evaluarBloqueo(String correo) {
    if (correo == null || correo.isBlank() || usuarioRepository == null) return;

    PoliticaAcceso politica = politicaDelUsuario(correo);
    usuarioRepository
        .findByCorreo(correo)
        .ifPresent(
            u -> {
              if (u.getBloqueoHasta() != null
                  && LocalDateTime.now().isBefore(u.getBloqueoHasta())) {
                throw new IllegalStateException(
                    "Cuenta bloqueada temporalmente por superar el límite de "
                        + politica.getMaxIntentosFallidos()
                        + " intentos fallidos. Intente nuevamente en "
                        + politica.getMinutosBloqueo()
                        + " minutos.");
              }
              if (u.getBloqueoHasta() != null
                  && !LocalDateTime.now().isBefore(u.getBloqueoHasta())) {
                u.reiniciarIntentos();
              }
              if (politica.debeBloquear(u.getIntentosFallidos())) {
                throw new IllegalStateException(
                    "Cuenta bloqueada temporalmente por superar el límite de "
                        + politica.getMaxIntentosFallidos()
                        + " intentos fallidos. Intente nuevamente en "
                        + politica.getMinutosBloqueo()
                        + " minutos.");
              }
            });
  }

  @Transactional
  public void registrarIntento(String correo, boolean exitoso) {
    if (correo == null || correo.isBlank() || usuarioRepository == null) return;
    PoliticaAcceso politica = politicaDelUsuario(correo);
    usuarioRepository
        .findByCorreo(correo)
        .ifPresent(
            u -> {
              if (exitoso) {
                u.reiniciarIntentos();
              } else {
                u.registrarIntentoFallido(
                    politica.getMaxIntentosFallidos(), politica.getMinutosBloqueo());
              }
              usuarioRepository.save(u);
            });
  }

  @Transactional
  public void liberarBloqueo(String correo) {
    if (correo != null && !correo.isBlank() && usuarioRepository != null) {
      usuarioRepository
          .findByCorreo(correo)
          .ifPresent(
              u -> {
                u.reiniciarIntentos();
                usuarioRepository.save(u);
              });
    }
  }

  private PoliticaAcceso politicaPorDefecto() {
    PoliticaAcceso policy = new PoliticaAcceso(5, 15, 12, 3000);
    policy.setIdEstablecimiento(TenantContext.current());
    return policy;
  }

  private PoliticaAcceso politicaDelUsuario(String correo) {
    if (usuarioRepository == null) return obtenerPolitica();
    Long tenant =
        usuarioRepository
            .findByCorreo(correo)
            .map(Usuario::getIdEstablecimiento)
            .orElse(TenantContext.current());
    return politicaAccesoRepository
        .findByIdEstablecimiento(tenant)
        .orElseGet(
            () -> {
              PoliticaAcceso policy = new PoliticaAcceso(5, 15, 12, 3000);
              policy.setIdEstablecimiento(tenant);
              return policy;
            });
  }
}
