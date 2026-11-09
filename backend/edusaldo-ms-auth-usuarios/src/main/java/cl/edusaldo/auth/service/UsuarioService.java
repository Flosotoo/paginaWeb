package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {
  private static final java.security.SecureRandom CLAVES_TEMPORALES = new java.security.SecureRandom();

  private static String claveTemporal() {
    return "Edu" + (100000 + CLAVES_TEMPORALES.nextInt(900000));
  }

  private java.util.Optional<Usuario> buscarIdentificador(String identificador) {
    if (identificador == null) return java.util.Optional.empty();
    if (identificador.contains("@")) return usuarioRepository.findByCorreo(identificador.trim());
    try { return usuarioRepository.findByRut(Rut.normalizar(identificador)); }
    catch (IllegalArgumentException ex) { return java.util.Optional.empty(); }
  }

  @Autowired(required = false)
  private SesionService sesionService;

  @Autowired(required = false)
  private CorreoSimuladoService correoSimuladoService;

  private final UsuarioRepository usuarioRepository;
  private final AlumnoRepository alumnoRepository;
  private final ApoderadoRepository apoderadoRepository;
  private final ApoderadoAlumnoRepository apoderadoAlumnoRepository;
  private final PoliticaAccesoService politicaAccesoService;
  private final AuditoriaService auditoriaService;
  private final TokenRecuperacionRepository tokenRecuperacionRepository;

  @Autowired(required = false)
  private SolicitudCorreccionDatosRepository solicitudCorreccionRepository;

  @Autowired(required = false)
  private AdscripcionRepository adscripcionRepository;

  @Autowired(required = false)
  private ImportacionNominaRepository importacionNominaRepository;

  public UsuarioService(
      UsuarioRepository usuarioRepository,
      AlumnoRepository alumnoRepository,
      ApoderadoRepository apoderadoRepository,
      ApoderadoAlumnoRepository apoderadoAlumnoRepository,
      PoliticaAccesoService politicaAccesoService,
      AuditoriaService auditoriaService,
      TokenRecuperacionRepository tokenRecuperacionRepository) {
    this.usuarioRepository = usuarioRepository;
    this.alumnoRepository = alumnoRepository;
    this.apoderadoRepository = apoderadoRepository;
    this.apoderadoAlumnoRepository = apoderadoAlumnoRepository;
    this.politicaAccesoService = politicaAccesoService;
    this.auditoriaService = auditoriaService;
    this.tokenRecuperacionRepository = tokenRecuperacionRepository;
  }

  // Failed credentials must commit their counter before the error reaches the client.
  @Transactional(noRollbackFor = {IllegalArgumentException.class, IllegalStateException.class})
  public LoginResponseDTO login(LoginRequestDTO dto) {
    Usuario usuario =
        buscarIdentificador(dto.getIdentificador())
            .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));

    if (!usuario.puedeIniciarSesion()) {
      if (usuario instanceof Alumno alumno && alumno.calcularEdad() < 12) {
        throw new IllegalStateException(
            "Los alumnos menores de 12 años no tienen acceso autónomo al sistema.");
      }
      if (usuario.getEstado() == EstadoCuenta.INACTIVA) {
        throw new IllegalStateException("La cuenta se encuentra inactiva.");
      }
      throw new IllegalStateException("Usuario no habilitado para iniciar sesión.");
    }

    politicaAccesoService.evaluarBloqueo(usuario.getCorreo());

    boolean passwordValida =
        usuario.getPasswordHash() != null
            && PasswordCodec.matches(dto.getPassword(), usuario.getPasswordHash());

    if (!passwordValida) {
      politicaAccesoService.registrarIntento(usuario.getCorreo(), false);
      throw new IllegalArgumentException("Contraseña incorrecta.");
    }

    politicaAccesoService.registrarIntento(usuario.getCorreo(), true);
    if (!usuario.getPasswordHash().startsWith("pbkdf2$"))
      usuario.setPasswordHash(PasswordCodec.hash(dto.getPassword()));
    usuario.registrarAccesoExitoso();
    usuarioRepository.save(usuario);

    String simulatedJwt =
        sesionService != null ? sesionService.emitir(usuario) : UUID.randomUUID().toString();

    return new LoginResponseDTO(
        simulatedJwt,
        usuario.getId(),
        usuario.getIdEstablecimiento(),
        usuario.getRut(),
        usuario.getNombreCompleto(),
        usuario.getCorreo(),
        usuario.getRol(),
        usuario.getEstado());
  }

  public Long idSesion(String authorization) {
    if (authorization == null || !authorization.startsWith("Bearer "))
      throw new IllegalArgumentException("Sesión requerida");
    return ((Number) sesionService.validar(authorization.substring(7)).get("usuarioId"))
        .longValue();
  }

  public void revocarSesion(String authorization) {
    if (sesionService != null && authorization != null && authorization.startsWith("Bearer "))
      sesionService.revocar(authorization.substring(7));
  }

  @Transactional
  public Usuario crearUsuario(CrearUsuarioDTO dto) {
    dto.setRut(Rut.normalizar(dto.getRut()));
    if (usuarioRepository.existsByRut(dto.getRut())) {
      throw new IllegalArgumentException("El RUT ya se encuentra registrado.");
    }
    if (usuarioRepository.existsByCorreo(dto.getCorreo())) {
      throw new IllegalArgumentException("El correo ya se encuentra registrado.");
    }

    String passwordTemporal = claveTemporal();
    Usuario u;

    Rol rol = dto.getRol() != null ? dto.getRol() : Rol.APODERADO;
    if (rol == Rol.ALUMNO)
      throw new IllegalArgumentException("Registre al alumno junto con su apoderado");
    switch (rol) {
      case ADMINISTRADOR ->
          u =
              new Administrador(
                  dto.getRut(),
                  dto.getPrimerNombre(),
                  dto.getPrimerApellido(),
                  dto.getCorreo(),
                  passwordTemporal);
      case ENCARGADO ->
          u =
              new Encargado(
                  dto.getRut(),
                  dto.getPrimerNombre(),
                  dto.getPrimerApellido(),
                  dto.getCorreo(),
                  passwordTemporal);
      case APODERADO ->
          u =
              new Apoderado(
                  dto.getRut(),
                  dto.getPrimerNombre(),
                  dto.getPrimerApellido(),
                  dto.getCorreo(),
                  passwordTemporal,
                  dto.getTelefono());
      case ALUMNO -> {
        Alumno al =
            new Alumno(
                dto.getRut(),
                dto.getPrimerNombre(),
                dto.getPrimerApellido(),
                dto.getCorreo(),
                passwordTemporal,
                dto.getFechaNacimiento(),
                dto.getCurso());
        al.setEstado(al.calcularEdad() >= 12 ? EstadoCuenta.PRIMER_ACCESO : EstadoCuenta.ACTIVA);
        u = al;
      }
      default ->
          u =
              new Apoderado(
                  dto.getRut(),
                  dto.getPrimerNombre(),
                  dto.getPrimerApellido(),
                  dto.getCorreo(),
                  passwordTemporal,
                  dto.getTelefono());
    }

    TenantContext.requireTenant(dto.getIdEstablecimiento());
    u.setIdEstablecimiento(TenantContext.current());
    u.setSegundoNombre(dto.getSegundoNombre());
    u.setSegundoApellido(dto.getSegundoApellido());

    Usuario guardado = usuarioRepository.save(u);
    if (correoSimuladoService != null)
      correoSimuladoService.registrar(guardado, "CLAVE_TEMPORAL", passwordTemporal);
    if (adscripcionRepository != null && guardado.getId() != null) {
      adscripcionRepository.save(
          new Adscripcion(guardado.getIdEstablecimiento(), guardado.getId()));
    }
    auditoriaService.registrar(
        null,
        "CREAR_USUARIO",
        u.getClass().getSimpleName(),
        guardado.getId().toString(),
        "Usuario creado: " + guardado.getRut() + " (" + guardado.getRol() + ")");
    return guardado;
  }

  @Transactional
  public AltaAlumnoApoderadoResponseDTO registrarAlumnoConApoderado(AltaAlumnoApoderadoDTO dto) {
    TenantContext.requireTenant(dto.getIdEstablecimiento());
    dto.setRutAlumno(Rut.normalizar(dto.getRutAlumno()));
    dto.setRutApoderado(Rut.normalizar(dto.getRutApoderado()));
    if (usuarioRepository.existsByRut(dto.getRutAlumno())) {
      throw new IllegalArgumentException(
          "El RUT del alumno ya está registrado: " + dto.getRutAlumno());
    }

    Apoderado apoderado =
        apoderadoRepository
            .findByRut(dto.getRutApoderado())
            .orElseGet(
                () -> {
                  String passTempApoderado = claveTemporal();
                  Apoderado nuevoApoderado =
                      new Apoderado(
                          dto.getRutApoderado(),
                          dto.getPrimerNombreApoderado(),
                          dto.getPrimerApellidoApoderado(),
                          dto.getCorreoApoderado(),
                          passTempApoderado,
                          dto.getTelefonoApoderado());
                  nuevoApoderado.setIdEstablecimiento(dto.getIdEstablecimiento());
                  nuevoApoderado.setSegundoNombre(dto.getSegundoNombreApoderado());
                  nuevoApoderado.setSegundoApellido(dto.getSegundoApellidoApoderado());
                  nuevoApoderado.setEstado(EstadoCuenta.PRIMER_ACCESO);
                  Apoderado guardado = apoderadoRepository.save(nuevoApoderado);
                  if (correoSimuladoService != null)
                    correoSimuladoService.registrar(guardado, "CLAVE_TEMPORAL", passTempApoderado);
                  return guardado;
                });

    TenantContext.requireTenant(apoderado.getIdEstablecimiento());
    if (apoderado.getEstado() == EstadoCuenta.INACTIVA)
      throw new IllegalStateException("El apoderado debe tener una cuenta habilitada");

    String correoAlumno = dto.getCorreoAlumno();
    if (correoAlumno == null || correoAlumno.isBlank()) {
      String base =
          (dto.getPrimerNombreAlumno() + "." + dto.getPrimerApellidoAlumno())
              .toLowerCase()
              .replaceAll("[^a-z0-9.]", "");
      correoAlumno = base + "@alumnos.colegio.cl";
      int count = 1;
      while (usuarioRepository.existsByCorreo(correoAlumno)) {
        correoAlumno = base + (count++) + "@alumnos.colegio.cl";
      }
    } else if (usuarioRepository.existsByCorreo(correoAlumno)) {
      throw new IllegalArgumentException(
          "El correo institucional del alumno ya se encuentra registrado: " + correoAlumno);
    }

    String passTempAlumno = claveTemporal();
    Alumno alumno =
        new Alumno(
            dto.getRutAlumno(),
            dto.getPrimerNombreAlumno(),
            dto.getPrimerApellidoAlumno(),
            correoAlumno,
            passTempAlumno,
            dto.getFechaNacimiento(),
            dto.getCurso());
    alumno.setIdEstablecimiento(dto.getIdEstablecimiento());
    alumno.setSegundoNombre(dto.getSegundoNombreAlumno());
    alumno.setSegundoApellido(dto.getSegundoApellidoAlumno());
    alumno.setEstado(
        alumno.calcularEdad() >= 12 ? EstadoCuenta.PRIMER_ACCESO : EstadoCuenta.ACTIVA);

    Alumno alumnoGuardado = alumnoRepository.save(alumno);
    if (correoSimuladoService != null)
      correoSimuladoService.registrar(alumnoGuardado, "CLAVE_TEMPORAL", passTempAlumno);

    Parentesco parentesco = dto.getParentesco() != null ? dto.getParentesco() : Parentesco.PADRE;
    ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumnoGuardado, parentesco);
    apoderadoAlumnoRepository.save(rel);

    auditoriaService.registrar(
        null,
        "ALTA_ATOMICA",
        "Alumno",
        alumnoGuardado.getId().toString(),
        "Alta atómica Alumno "
            + alumnoGuardado.getRut()
            + " con Apoderado "
            + apoderado.getRut()
            + " ("
            + parentesco
            + ")");

    return new AltaAlumnoApoderadoResponseDTO(
        alumnoGuardado.getId(),
        apoderado.getId(),
        alumnoGuardado.getRut(),
        alumnoGuardado.getNombreCompleto(),
        apoderado.getRut(),
        apoderado.getNombreCompleto(),
        parentesco.name(),
        "Alta atómica realizada exitosamente");
  }

  @Transactional
  public List<AltaAlumnoApoderadoResponseDTO> importarNominaMasiva(
      List<AltaAlumnoApoderadoDTO> nomina) {
    if (nomina == null || nomina.isEmpty()) {
      throw new IllegalArgumentException("La nómina de alumnos a importar no puede estar vacía.");
    }
    List<AltaAlumnoApoderadoResponseDTO> resultados = new ArrayList<>();
    ImportacionNomina imp =
        new ImportacionNomina(
            TenantContext.current(), TenantContext.actor(), nomina.size(), nomina.size(), 0);
    int filaNum = 1;
    for (AltaAlumnoApoderadoDTO dto : nomina) {
      AltaAlumnoApoderadoResponseDTO res;
      try {
        res = registrarAlumnoConApoderado(dto);
      } catch (IllegalArgumentException | IllegalStateException ex) {
        throw new IllegalArgumentException("Fila " + filaNum + ": " + ex.getMessage(), ex);
      }
      resultados.add(res);
      imp.agregarFila(
          new FilaNomina(
              imp,
              filaNum++,
              dto.getRutAlumno(),
              dto.getRutApoderado(),
              "VALIDA",
              "Importado exitosamente"));
    }
    if (importacionNominaRepository != null) {
      importacionNominaRepository.save(imp);
    }
    auditoriaService.registrar(
        TenantContext.actor(),
        "IMPORTACION_NOMINA_MASIVA",
        "Alumno",
        String.valueOf(resultados.size()),
        "Importación masiva de " + resultados.size() + " alumnos con apoderado");
    return resultados;
  }

  @Transactional
  public ApoderadoAlumno vincularApoderadoExistente(
      Long alumnoId, Long apoderadoId, Parentesco parentesco, Long adminId) {
    Alumno alumno =
        alumnoRepository
            .findById(alumnoId)
            .orElseThrow(
                () -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));
    Apoderado apoderado =
        apoderadoRepository
            .findById(apoderadoId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException("Apoderado no encontrado con ID: " + apoderadoId));

    TenantContext.requireTenant(alumno.getIdEstablecimiento());
    TenantContext.requireTenant(apoderado.getIdEstablecimiento());
    Parentesco p = parentesco != null ? parentesco : Parentesco.PADRE;
    ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumno, p);
    ApoderadoAlumno guardada = apoderadoAlumnoRepository.save(rel);

    auditoriaService.registrar(
        TenantContext.actor(),
        "VINCULAR_APODERADO",
        "ApoderadoAlumno",
        apoderadoId + "-" + alumnoId,
        "Asociación creada con parentesco " + p.name());
    return guardada;
  }

  @Transactional
  public void desvincularApoderado(
      Long alumnoId, Long apoderadoId, String motivo, Long usuarioAdminId) {
    Alumno alumno =
        alumnoRepository
            .bloquear(alumnoId, TenantContext.current())
            .orElseThrow(
                () -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));

    Apoderado apoderado =
        apoderadoRepository
            .findById(apoderadoId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException("Apoderado no encontrado con ID: " + apoderadoId));

    ApoderadoAlumno rel =
        apoderadoAlumnoRepository
            .findByIdApoderadoIdAndIdAlumnoId(apoderadoId, alumnoId)
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "No existe asociación entre el apoderado y el alumno"));

    TenantContext.requireTenant(alumno.getIdEstablecimiento());
    TenantContext.requireTenant(apoderado.getIdEstablecimiento());
    if (!rel.isActivo()) throw new IllegalStateException("La asociación ya está inactiva");
    long countActivos =
        apoderadoAlumnoRepository
            .bloquearApoderadosHabilitados(alumnoId, TenantContext.current())
            .size();
    if (alumno.getEstado() != EstadoCuenta.INACTIVA && countActivos <= 1) {
      throw new IllegalStateException(
          "No es posible desvincular al único apoderado de un alumno activo.");
    }

    rel.desvincular(motivo);
    apoderadoAlumnoRepository.save(rel);
    // The relationship remains attached so flushing cannot delete its history.

    auditoriaService.registrar(
        TenantContext.actor(),
        "DESVINCULACION_APODERADO",
        "ApoderadoAlumno",
        apoderadoId + "-" + alumnoId,
        "Motivo: " + (motivo != null ? motivo : "Sin motivo informado"));
  }

  @Transactional
  public SolicitudCorreccionDatos registrarSolicitudCorreccion(SolicitudCorreccionDTO dto) {
    Usuario u =
        usuarioRepository
            .findById(dto.getUsuarioId())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Usuario no encontrado con ID: " + dto.getUsuarioId()));

    TenantContext.requireTenant(u.getIdEstablecimiento());
    TenantContext.requireOwn(u.getId());
    validarCorreccion(u, dto.getCampoSolicitado(), dto.getValorPropuesto());
    SolicitudCorreccionDatos sol =
        new SolicitudCorreccionDatos(
            u.getIdEstablecimiento(),
            u.getId(),
            dto.getCampoSolicitado(),
            dto.getValorActual(),
            dto.getValorPropuesto(),
            dto.getMotivo());
    SolicitudCorreccionDatos guardada =
        solicitudCorreccionRepository != null ? solicitudCorreccionRepository.save(sol) : sol;

    auditoriaService.registrar(
        u.getId(),
        "SOLICITAR_CORRECCION_DATOS",
        "SolicitudCorreccionDatos",
        guardada.getId() != null ? guardada.getId().toString() : "0",
        "Campo: " + dto.getCampoSolicitado() + " -> " + dto.getValorPropuesto());
    return guardada;
  }

  @Transactional(readOnly = true)
  public List<SolicitudCorreccionDatos> listarSolicitudesCorreccion() {
    if (solicitudCorreccionRepository == null) {
      return List.of();
    }
    return solicitudCorreccionRepository
        .findByIdEstablecimientoOrderByFechaSolicitudDesc(TenantContext.current())
        .stream()
        .filter(
            sol ->
                "ADMINISTRADOR".equals(TenantContext.role())
                    || TenantContext.actor() == null
                    || TenantContext.actor().equals(sol.getUsuarioId()))
        .toList();
  }

  @Transactional
  public SolicitudCorreccionDatos resolverSolicitudCorreccion(
      Long solicitudId, boolean aprobar, Long adminId, String observacion) {
    if (!"ADMINISTRADOR".equals(TenantContext.role()))
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Solo administración resuelve solicitudes");
    if (solicitudCorreccionRepository == null) {
      throw new IllegalStateException("Repositorio de solicitudes de corrección no disponible");
    }
    SolicitudCorreccionDatos sol =
        solicitudCorreccionRepository
            .findByIdAndIdEstablecimiento(solicitudId, TenantContext.current())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Solicitud de corrección no encontrada: " + solicitudId));

    TenantContext.requireTenant(sol.getIdEstablecimiento());
    if (!"PENDIENTE".equals(sol.getEstado()))
      throw new IllegalStateException("La solicitud ya fue resuelta");
    if (aprobar) {
      Usuario u =
          usuarioRepository
              .findById(sol.getUsuarioId())
              .orElseThrow(() -> new IllegalArgumentException("Usuario asociado no encontrado"));
      validarCorreccion(u, sol.getCampoSolicitado(), sol.getValorPropuesto());
      String campo =
          sol.getCampoSolicitado() != null ? sol.getCampoSolicitado().trim().toLowerCase() : "";
      switch (campo) {
        case "correo" -> u.setCorreo(sol.getValorPropuesto());
        case "primernombre", "primer_nombre" -> u.setPrimerNombre(sol.getValorPropuesto());
        case "primerapellido", "primer_apellido" -> u.setPrimerApellido(sol.getValorPropuesto());
        case "telefono" -> {
          if (u instanceof Apoderado ap) {
            ap.setTelefono(sol.getValorPropuesto());
          }
        }
        case "curso" -> {
          if (u instanceof Alumno al) {
            al.setCurso(sol.getValorPropuesto());
          }
        }
      }
      usuarioRepository.save(u);
    }

    sol.resolver(aprobar, TenantContext.actor(), observacion);
    SolicitudCorreccionDatos guardada = solicitudCorreccionRepository.save(sol);
    auditoriaService.registrar(
        TenantContext.actor(),
        aprobar ? "APROBAR_CORRECCION_DATOS" : "RECHAZAR_CORRECCION_DATOS",
        "SolicitudCorreccionDatos",
        solicitudId.toString(),
        "Observación: " + (observacion != null ? observacion : ""));
    return guardada;
  }

  private void validarCorreccion(Usuario usuario, String campo, String valor) {
    String nombre = campo == null ? "" : campo.trim().toLowerCase(java.util.Locale.ROOT);
    if (valor == null || valor.isBlank()) throw new IllegalArgumentException("El valor propuesto es obligatorio");
    int maximo = switch (nombre) {
      case "correo" -> 150;
      case "primernombre", "primer_nombre", "primerapellido", "primer_apellido" -> 100;
      case "telefono" -> {
        if (!(usuario instanceof Apoderado)) throw new IllegalArgumentException("El teléfono corresponde a un apoderado");
        yield 30;
      }
      case "curso" -> {
        if (!(usuario instanceof Alumno)) throw new IllegalArgumentException("El curso corresponde a un alumno");
        yield 50;
      }
      default -> throw new IllegalArgumentException("Campo de corrección no admitido");
    };
    if (valor.length() > maximo) throw new IllegalArgumentException("El valor propuesto excede el máximo permitido");
    if ("correo".equals(nombre)) {
      if (!valor.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
        throw new IllegalArgumentException("Correo inválido");
      usuarioRepository.findByCorreo(valor).filter(existente -> !existente.getId().equals(usuario.getId()))
          .ifPresent(existente -> { throw new IllegalArgumentException("El correo ya está en uso"); });
    }
  }

  @Transactional(readOnly = true)
  public List<AlumnoResponseDTO> obtenerAlumnosDeApoderado(Long apoderadoId) {
    obtenerPorId(apoderadoId);
    List<ApoderadoAlumno> asociaciones = apoderadoAlumnoRepository.findByIdApoderadoId(apoderadoId);
    List<AlumnoResponseDTO> result = new ArrayList<>();
    for (ApoderadoAlumno rel : asociaciones) {
      if (rel.isActivo() && rel.getAlumno() != null) {
        result.add(new AlumnoResponseDTO(rel.getAlumno(), rel.getParentesco()));
      }
    }
    return result;
  }

  @Transactional
  public void cambiarPassword(Long id, CambiarPasswordDTO dto) {
    Usuario u =
        usuarioRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

    TenantContext.requireTenant(u.getIdEstablecimiento());
    TenantContext.requireOwn(u.getId());
    if (u.getEstado() == EstadoCuenta.INACTIVA)
      throw new IllegalStateException("La cuenta se encuentra inactiva");
    u.cambiarPassword(dto.getNuevaPassword());
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    usuarioRepository.save(u);
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    auditoriaService.registrar(
        id, "CAMBIO_PASSWORD", "Usuario", id.toString(), "Cambio voluntario de contraseña");
  }

  @Transactional
  public void cambiarPasswordAuth(CambiarPasswordAuthDTO dto) {
    Usuario u =
        buscarIdentificador(dto.getIdentificador())
            .orElseThrow(
                () -> new IllegalArgumentException("Usuario no encontrado con identificador"));

    boolean actualValida =
        u.getPasswordHash() != null
            && PasswordCodec.matches(dto.getPasswordActual(), u.getPasswordHash());

    if (!actualValida) {
      throw new IllegalArgumentException("La contraseña actual es incorrecta.");
    }

    TenantContext.requireTenant(u.getIdEstablecimiento());
    TenantContext.requireOwn(u.getId());
    u.cambiarPassword(dto.getPasswordNueva());
    usuarioRepository.save(u);
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    auditoriaService.registrar(
        u.getId(),
        "CAMBIO_PASSWORD_AUTH",
        "Usuario",
        u.getId().toString(),
        "Cambio exitoso de contraseña");
  }

  private String hashSha256(String input) {
    if (input == null) return null;
    try {
      java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
      byte[] bytes = md.digest(input.getBytes(java.nio.charset.StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : bytes) {
        sb.append(String.format("%02x", b));
      }
      return sb.toString();
    } catch (java.security.NoSuchAlgorithmException e) {
      throw new RuntimeException("Error calculando hash SHA-256", e);
    }
  }

  @Transactional
  public String solicitarRecuperacionPassword(String correo) {
    Usuario u = usuarioRepository.findByCorreo(correo).orElse(null);
    if (u == null || u.getEstado() == EstadoCuenta.INACTIVA) return "";

    String token = UUID.randomUUID().toString();
    String hashToken = hashSha256(token);
    if (correoSimuladoService != null) correoSimuladoService.registrar(u, "RECUPERACION", token);
    TokenRecuperacion tr =
        new TokenRecuperacion(u.getId(), hashToken, LocalDateTime.now().plusHours(2));
    tr = tokenRecuperacionRepository.save(tr);

    auditoriaService.registrar(
        u.getId(),
        "SOLICITUD_RECUPERACION_PASSWORD",
        "TokenRecuperacion",
        tr.getId() != null ? tr.getId().toString() : "0",
        "Solicitud de recuperación generada");
    return token;
  }

  @Transactional
  public void confirmarRecuperacionPassword(ConfirmarRecuperacionDTO dto) {
    String tokenRaw = dto.getToken();
    String hashToken = hashSha256(tokenRaw);
    TokenRecuperacion tr =
        tokenRecuperacionRepository
            .findByHashToken(hashToken)
            .orElseThrow(
                () ->
                    new IllegalArgumentException("Token de recuperación no válido o inexistente"));

    if (!tr.estaVigente()) {
      throw new IllegalStateException("El token de recuperación ha expirado o ya fue utilizado.");
    }

    Usuario u =
        usuarioRepository
            .findById(tr.getUsuarioId())
            .orElseThrow(() -> new IllegalArgumentException("Usuario asociado al token no existe"));

    if (u.getEstado() == EstadoCuenta.INACTIVA)
      throw new IllegalStateException("La cuenta se encuentra inactiva");
    u.cambiarPassword(dto.getNuevaPassword());
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    tr.marcarUsado();

    tokenRecuperacionRepository.save(tr);
    usuarioRepository.save(u);
    auditoriaService.registrar(
        u.getId(),
        "RECUPERACION_PASSWORD_EXITOSA",
        "Usuario",
        u.getId().toString(),
        "Contraseña reestablecida vía token");
  }

  @Transactional
  public String restablecerPassword(Long id, Long adminId) {
    Usuario u =
        usuarioRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

    TenantContext.requireTenant(u.getIdEstablecimiento());
    String tempPass = claveTemporal();
    u.restablecerPassword(tempPass);
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    if (correoSimuladoService != null)
      correoSimuladoService.registrar(u, "CLAVE_TEMPORAL", tempPass);
    usuarioRepository.save(u);

    politicaAccesoService.liberarBloqueo(u.getCorreo());

    auditoriaService.registrar(
        TenantContext.actor(),
        "RESTABLECER_PASSWORD_ADMIN",
        "Usuario",
        id.toString(),
        "Clave temporal asignada por administrador");
    return tempPass;
  }

  @Transactional
  public void inactivar(Long id, Long adminId) {
    Usuario u =
        usuarioRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
    TenantContext.requireTenant(u.getIdEstablecimiento());
    if (u instanceof Alumno)
      throw new IllegalStateException("La baja de alumnos está suspendida hasta contar con un cierre de saldo seguro");
    if (u instanceof Apoderado) {
      var asociaciones =
          apoderadoAlumnoRepository.findByIdApoderadoId(id).stream()
              .sorted(java.util.Comparator.comparing(v -> v.getAlumno().getId()))
              .toList();
      for (ApoderadoAlumno rel : asociaciones) {
        // Acquire all pupils before tutors so overlapping families cannot reverse lock order.
        alumnoRepository
            .bloquear(rel.getAlumno().getId(), TenantContext.current())
            .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado"));
      }
      for (ApoderadoAlumno rel : asociaciones) {
        // A locking read sees committed tutor changes even when this transaction has an older
        // snapshot.
        if (rel.isActivo()
            && rel.getAlumno().getEstado() != EstadoCuenta.INACTIVA
            && apoderadoAlumnoRepository
                    .bloquearApoderadosHabilitados(rel.getAlumno().getId(), TenantContext.current())
                    .size()
                <= 1)
          throw new IllegalStateException(
              "No se puede inactivar al único apoderado de un alumno activo");
      }
    }
    u.inactivar();
    if (sesionService != null) sesionService.revocarUsuario(u.getId());
    usuarioRepository.save(u);
    auditoriaService.registrar(
        TenantContext.actor(),
        "INACTIVAR_USUARIO",
        "Usuario",
        id.toString(),
        "Cuenta de usuario inactivada");
  }

  @Transactional
  public void reactivar(Long id, Long adminId) {
    Usuario u =
        usuarioRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
    TenantContext.requireTenant(u.getIdEstablecimiento());
    if (u instanceof Alumno) {
      alumnoRepository.bloquear(id, TenantContext.current()).orElseThrow();
      if (apoderadoAlumnoRepository
          .bloquearApoderadosHabilitados(id, TenantContext.current())
          .isEmpty())
        throw new IllegalStateException(
            "Un alumno activo necesita al menos un apoderado habilitado");
    }
    u.reactivar();
    usuarioRepository.save(u);
    auditoriaService.registrar(
        TenantContext.actor(),
        "REACTIVAR_USUARIO",
        "Usuario",
        id.toString(),
        "Cuenta de usuario reactivada");
  }

  @Transactional
  public void actualizarCursoAlumno(Long alumnoId, String nuevoCurso, Long adminId) {
    actualizarDatosAlumno(
        alumnoId,
        nuevoCurso == null ? java.util.Map.of() : java.util.Map.of("curso", nuevoCurso),
        adminId);
  }

  @Transactional
  public void actualizarDatosAlumno(
      Long alumnoId, java.util.Map<String, String> datos, Long adminId) {
    if (TenantContext.role() != null
        && !TenantContext.role().isBlank()
        && !"ADMINISTRADOR".equals(TenantContext.role())) {
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN,
          "Solo administración puede actualizar datos de alumnos");
    }
    if (datos == null || datos.isEmpty()) {
      throw new IllegalArgumentException("Debe indicar los datos o el curso a actualizar");
    }
    Alumno a =
        alumnoRepository
            .findById(alumnoId)
            .orElseThrow(
                () -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));
    TenantContext.requireTenant(a.getIdEstablecimiento());

    List<String> cambios = new ArrayList<>();
    for (String clave : datos.keySet()) {
      if ("idEstablecimiento".equals(clave)) {
        continue;
      }
      if (!java.util.Set.of(
              "rut",
              "primerNombre",
              "segundoNombre",
              "primerApellido",
              "segundoApellido",
              "correo",
              "fechaNacimiento",
              "curso")
          .contains(clave)) {
        throw new IllegalArgumentException("Campo de alumno no admitido: " + clave);
      }
    }
    if (datos.containsKey("rut")) {
      String rutNorm = Rut.normalizar(datos.get("rut"));
      usuarioRepository
          .findByRut(rutNorm)
          .filter(existente -> !existente.getId().equals(a.getId()))
          .ifPresent(
              existente -> {
                throw new IllegalArgumentException("El RUT ya se encuentra registrado.");
              });
      a.setRut(rutNorm);
      cambios.add("rut=" + rutNorm);
    }
    if (datos.containsKey("primerNombre")) {
      String nombre = datos.get("primerNombre");
      if (nombre == null || nombre.isBlank() || nombre.trim().length() > 100) {
        throw new IllegalArgumentException("El primer nombre del alumno es inválido");
      }
      a.setPrimerNombre(nombre.trim());
      cambios.add("primerNombre=" + nombre.trim());
    }
    if (datos.containsKey("segundoNombre")) {
      String segundo = datos.get("segundoNombre");
      if (segundo != null && segundo.trim().length() > 100) {
        throw new IllegalArgumentException("El segundo nombre excede el máximo permitido");
      }
      a.setSegundoNombre(segundo == null || segundo.isBlank() ? null : segundo.trim());
      cambios.add("segundoNombre");
    }
    if (datos.containsKey("primerApellido")) {
      String apellido = datos.get("primerApellido");
      if (apellido == null || apellido.isBlank() || apellido.trim().length() > 100) {
        throw new IllegalArgumentException("El primer apellido del alumno es inválido");
      }
      a.setPrimerApellido(apellido.trim());
      cambios.add("primerApellido=" + apellido.trim());
    }
    if (datos.containsKey("segundoApellido")) {
      String segundoAp = datos.get("segundoApellido");
      if (segundoAp != null && segundoAp.trim().length() > 100) {
        throw new IllegalArgumentException("El segundo apellido excede el máximo permitido");
      }
      a.setSegundoApellido(segundoAp == null || segundoAp.isBlank() ? null : segundoAp.trim());
      cambios.add("segundoApellido");
    }
    if (datos.containsKey("correo")) {
      String correo = datos.get("correo");
      if (correo == null
          || correo.isBlank()
          || correo.trim().length() > 150
          || !correo.trim().matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
        throw new IllegalArgumentException("Correo inválido");
      }
      String correoTrim = correo.trim();
      usuarioRepository
          .findByCorreo(correoTrim)
          .filter(existente -> !existente.getId().equals(a.getId()))
          .ifPresent(
              existente -> {
                throw new IllegalArgumentException("El correo ya se encuentra registrado.");
              });
      a.setCorreo(correoTrim);
      cambios.add("correo=" + correoTrim);
    }
    if (datos.containsKey("fechaNacimiento")) {
      String fechaRaw = datos.get("fechaNacimiento");
      if (fechaRaw == null || fechaRaw.isBlank()) {
        throw new IllegalArgumentException("La fecha de nacimiento no puede estar vacía");
      }
      java.time.LocalDate fecha;
      try {
        fecha = java.time.LocalDate.parse(fechaRaw.trim());
      } catch (java.time.format.DateTimeParseException ex) {
        throw new IllegalArgumentException("Fecha de nacimiento inválida", ex);
      }
      if (fecha.isAfter(java.time.LocalDate.now())) {
        throw new IllegalArgumentException("La fecha de nacimiento no puede ser futura");
      }
      a.setFechaNacimiento(fecha);
      cambios.add("fechaNacimiento=" + fecha);
    }
    if (datos.containsKey("curso")) {
      String nuevoCurso = datos.get("curso");
      if (nuevoCurso == null || nuevoCurso.isBlank() || nuevoCurso.trim().length() > 50) {
        throw new IllegalArgumentException(
            "El nuevo curso no puede estar vacío ni exceder 50 caracteres");
      }
      a.actualizarCurso(nuevoCurso.trim());
      cambios.add("curso=" + nuevoCurso.trim());
    }
    if (cambios.isEmpty()) {
      throw new IllegalArgumentException("Debe indicar al menos un dato o curso a actualizar");
    }
    alumnoRepository.save(a);
    auditoriaService.registrar(
        TenantContext.actor(),
        "ACTUALIZAR_CURSO",
        "Alumno",
        alumnoId.toString(),
        "Datos actualizados: " + String.join(", ", cambios));
  }

  @Transactional(readOnly = true)
  public boolean alumnoPuedeReservar(Long alumnoId) {
    if (alumnoId == null) return false;
    Usuario u = usuarioRepository.findById(alumnoId).orElse(null);
    if (u != null) TenantContext.requireTenant(u.getIdEstablecimiento());
    if (u instanceof Alumno alumno) {
      return alumno.calcularEdad() >= 12;
    }
    return false;
  }

  @Transactional(readOnly = true)
  public Usuario obtenerPorId(Long id) {
    Usuario u =
        usuarioRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
    TenantContext.requireTenant(u.getIdEstablecimiento());
    return u;
  }

  @Transactional(readOnly = true)
  public List<Usuario> listarTodos() {
    List<Usuario> list = usuarioRepository.findByIdEstablecimiento(TenantContext.current());
    return list;
  }

  @Transactional(readOnly = true)
  public java.util.Map<String, Object> buscarAlumno(String rut) {
    Alumno alumno =
        alumnoRepository
            .findByRut(Rut.normalizar(rut))
            .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado"));
    TenantContext.requireTenant(alumno.getIdEstablecimiento());
    if (!java.util.Set.of("ADMINISTRADOR", "ENCARGADO").contains(TenantContext.role())
        && !TenantContext.technical())
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Permiso requerido");
    return java.util.Map.of(
        "id",
        alumno.getId(),
        "rut",
        alumno.getRut(),
        "nombreCompleto",
        alumno.getNombreCompleto(),
        "curso",
        alumno.getCurso(),
        "estado",
        alumno.getEstado().name(),
        "idEstablecimiento",
        alumno.getIdEstablecimiento());
  }

  @Transactional(readOnly = true)
  public List<java.util.Map<String, Object>> obtenerApoderados(
      Long alumnoId, boolean incluirInactivos) {
    obtenerPorId(alumnoId);
    if (!"ADMINISTRADOR".equals(TenantContext.role()) && !TenantContext.technical())
      throw new org.springframework.web.server.ResponseStatusException(
          org.springframework.http.HttpStatus.FORBIDDEN, "Permiso requerido");
    return apoderadoAlumnoRepository.findByIdAlumnoId(alumnoId).stream()
        .filter(rel -> incluirInactivos || rel.isActivo())
        .map(
            rel -> {
              Apoderado ap = rel.getApoderado();
              java.util.Map<String, Object> row = new java.util.LinkedHashMap<>();
              row.put("id", ap.getId());
              row.put("apoderadoId", ap.getId());
              row.put("idEstablecimiento", ap.getIdEstablecimiento());
              row.put("rut", ap.getRut());
              row.put("nombreCompleto", ap.getNombreCompleto());
              row.put("correo", ap.getCorreo());
              row.put("telefono", ap.getTelefono());
              row.put("estado", ap.getEstado().name());
              row.put("parentesco", rel.getParentesco().name());
              row.put("activo", rel.isActivo());
              row.put("fechaAsociacion", rel.getFechaAsociacion());
              row.put("fechaDesvinculacion", rel.getFechaDesvinculacion());
              row.put("motivoDesvinculacion", rel.getMotivoDesvinculacion());
              return row;
            })
        .toList();
  }
}
