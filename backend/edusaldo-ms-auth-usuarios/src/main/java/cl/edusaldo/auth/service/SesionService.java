package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import java.security.*;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionService {
  private final SesionUsuarioRepository sesiones;
  private final ApoderadoAlumnoRepository vinculos;

  @org.springframework.beans.factory.annotation.Autowired
  private PoliticaAccesoRepository politicas;

  public SesionService(SesionUsuarioRepository sesiones, ApoderadoAlumnoRepository vinculos) {
    this.sesiones = sesiones;
    this.vinculos = vinculos;
  }

  private String hash(String token) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  @Transactional
  public String emitir(Usuario usuario) {
    byte[] bytes = new byte[32];
    new SecureRandom().nextBytes(bytes);
    String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    SesionUsuario s = new SesionUsuario();
    s.hash = hash(token);
    s.usuario = usuario;
    s.vencimiento = LocalDateTime.now().plusHours(1);
    sesiones.save(s);
    return token;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> validar(String token) {
    SesionUsuario s =
        sesiones
            .findById(hash(token))
            .orElseThrow(() -> new IllegalArgumentException("Sesión inválida"));
    if (s.revocada
        || s.vencimiento.isBefore(LocalDateTime.now())
        || !s.usuario.puedeIniciarSesion())
      throw new IllegalArgumentException("Sesión vencida o revocada");
    Usuario u = (Usuario) org.hibernate.Hibernate.unproxy(s.usuario);
    List<Long> alumnos = new ArrayList<>();
    if (u instanceof Alumno) alumnos.add(u.getId());
    if (u instanceof Apoderado)
      vinculos.findByIdApoderadoId(u.getId()).stream()
          .filter(ApoderadoAlumno::isActivo)
          .forEach(v -> alumnos.add(v.getAlumno().getId()));
    int umbral =
        politicas
            .findByIdEstablecimiento(u.getIdEstablecimiento())
            .map(PoliticaAcceso::getUmbralSaldoBajoClp)
            .orElse(3000);
    return Map.of(
        "usuarioId",
        u.getId(),
        "idEstablecimiento",
        u.getIdEstablecimiento(),
        "rol",
        u.getRol().replace("ROLE_", ""),
        "estado",
        u.getEstado().name(),
        "nombreCompleto",
        u.getNombreCompleto(),
        "alumnos",
        alumnos,
        "correo",
        u.getCorreo(),
        "rut",
        u.getRut(),
        "umbralSaldoBajoClp",
        umbral);
  }

  @Transactional
  public void revocarUsuario(Long usuarioId) {
    sesiones
        .findByUsuarioId(usuarioId)
        .forEach(
            s -> {
              s.revocada = true;
              sesiones.save(s);
            });
  }

  @Transactional
  public void revocar(String token) {
    sesiones
        .findById(hash(token))
        .ifPresent(
            s -> {
              s.revocada = true;
              sesiones.save(s);
            });
  }
}
