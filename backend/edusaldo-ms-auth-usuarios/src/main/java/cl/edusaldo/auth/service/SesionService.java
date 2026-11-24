package cl.edusaldo.auth.service;

import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import io.jsonwebtoken.Claims;
import java.security.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SesionService {
  private final SesionUsuarioRepository sesiones;
  private final ApoderadoAlumnoRepository vinculos;
  private final JwtService jwt;

  @org.springframework.beans.factory.annotation.Autowired
  private PoliticaAccesoRepository politicas;

  public SesionService(
      SesionUsuarioRepository sesiones, ApoderadoAlumnoRepository vinculos, JwtService jwt) {
    this.sesiones = sesiones;
    this.vinculos = vinculos;
    this.jwt = jwt;
  }

  private String hash(String valor) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256")
                  .digest(valor.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  @Transactional
  public String emitir(Usuario usuario) {
    Instant emision = Instant.now();
    Instant vencimiento = emision.plusSeconds(jwt.getExpirationSeconds());
    String jti = UUID.randomUUID().toString();
    String token = jwt.emitir(usuario, jti, emision, vencimiento);

    // Persistimos SHA-256(jti) para permitir revocación inmediata en logout o bloqueo sin cambiar DDL.
    SesionUsuario s = new SesionUsuario();
    s.hash = hash(jti);
    s.usuario = usuario;
    s.vencimiento = LocalDateTime.ofInstant(vencimiento, ZoneId.systemDefault());
    s.revocada = false;
    sesiones.save(s);
    return token;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> validar(String token) {
    Claims claims = jwt.verificar(token);
    String jti = claims.getId();
    long subjectId;
    try {
      subjectId = Long.parseLong(claims.getSubject());
    } catch (NumberFormatException ex) {
      throw new IllegalArgumentException("Token JWT inválido");
    }

    SesionUsuario s =
        sesiones
            .findById(hash(jti))
            .orElseThrow(() -> new IllegalArgumentException("Sesión inválida"));
    if (s.revocada
        || s.vencimiento.isBefore(LocalDateTime.now())
        || !s.usuario.puedeIniciarSesion()
        || !Objects.equals(s.usuario.getId(), subjectId))
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
    if (token == null || token.isBlank()) return;
    try {
      Claims claims = jwt.verificar(token);
      sesiones
          .findById(hash(claims.getId()))
          .ifPresent(
              s -> {
                s.revocada = true;
                sesiones.save(s);
              });
    } catch (IllegalArgumentException ignored) {
      // Un token ya inválido o expirado no otorga acceso y no requiere revocación adicional.
    }
  }
}
