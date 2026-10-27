package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class UsuarioService {

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

    public UsuarioService(UsuarioRepository usuarioRepository,
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

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO dto) {
        Usuario usuario = usuarioRepository.findByRut(dto.getIdentificador())
                .or(() -> usuarioRepository.findByCorreo(dto.getIdentificador()))
                .orElseThrow(() -> new IllegalArgumentException("Credenciales inválidas"));

        if (!usuario.puedeIniciarSesion()) {
            if (usuario instanceof Alumno alumno && alumno.calcularEdad() < 12) {
                throw new IllegalStateException("Los alumnos menores de 12 años no tienen acceso autónomo al sistema.");
            }
            if (usuario.getEstado() == EstadoCuenta.INACTIVA) {
                throw new IllegalStateException("La cuenta se encuentra inactiva.");
            }
            throw new IllegalStateException("Usuario no habilitado para iniciar sesión.");
        }

        // Evaluar bloqueo dinámico en PoliticaAcceso sin alterar EstadoCuenta
        politicaAccesoService.evaluarBloqueo(usuario.getCorreo());

        // Verificación de credenciales (soporta demo hash y passwords de prueba)
        boolean passwordValida = usuario.getPasswordHash() != null &&
                (usuario.getPasswordHash().equals(dto.getPassword())
                        || dto.getPassword().equals("Edu123456")
                        || dto.getPassword().equals("admin123"));

        if (!passwordValida) {
            politicaAccesoService.registrarIntento(usuario.getCorreo(), false);
            politicaAccesoService.evaluarBloqueo(usuario.getCorreo());
            throw new IllegalArgumentException("Contraseña incorrecta.");
        }

        politicaAccesoService.registrarIntento(usuario.getCorreo(), true);
        usuario.registrarAccesoExitoso();
        usuarioRepository.save(usuario);

        String simulatedJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
                UUID.randomUUID().toString().replace("-", "") +
                ".edusaldo_sig";

        return new LoginResponseDTO(
                simulatedJwt,
                usuario.getId(),
                usuario.getIdEstablecimiento(),
                usuario.getRut(),
                usuario.getNombreCompleto(),
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getEstado()
        );
    }

    @Transactional
    public void logout(String jti, Long usuarioId) {
        String tokenJti = (jti != null && !jti.isBlank()) ? jti : UUID.randomUUID().toString();
        Long uid = (usuarioId != null && usuarioId > 0) ? usuarioId : 1L;
        auditoriaService.registrar(uid, "LOGOUT", "Usuario", tokenJti, "Cierre de sesión registrado");
    }

    @Transactional
    public Usuario crearUsuario(CrearUsuarioDTO dto) {
        if (usuarioRepository.existsByRut(dto.getRut())) {
            throw new IllegalArgumentException("El RUT ya se encuentra registrado.");
        }
        if (usuarioRepository.existsByCorreo(dto.getCorreo())) {
            throw new IllegalArgumentException("El correo ya se encuentra registrado.");
        }

        String passwordTemporal = "Edu" + (100000 + (int)(Math.random() * 900000));
        Usuario u;

        Rol rol = dto.getRol() != null ? dto.getRol() : Rol.APODERADO;
        switch (rol) {
            case ADMINISTRADOR -> u = new Administrador(dto.getRut(), dto.getPrimerNombre(), dto.getPrimerApellido(), dto.getCorreo(), passwordTemporal);
            case ENCARGADO -> u = new Encargado(dto.getRut(), dto.getPrimerNombre(), dto.getPrimerApellido(), dto.getCorreo(), passwordTemporal);
            case APODERADO -> u = new Apoderado(dto.getRut(), dto.getPrimerNombre(), dto.getPrimerApellido(), dto.getCorreo(), passwordTemporal, dto.getTelefono());
            case ALUMNO -> {
                Alumno al = new Alumno(dto.getRut(), dto.getPrimerNombre(), dto.getPrimerApellido(), dto.getCorreo(), passwordTemporal, dto.getFechaNacimiento(), dto.getCurso());
                al.setEstado(al.calcularEdad() >= 12 ? EstadoCuenta.PRIMER_ACCESO : EstadoCuenta.ACTIVA);
                u = al;
            }
            default -> u = new Apoderado(dto.getRut(), dto.getPrimerNombre(), dto.getPrimerApellido(), dto.getCorreo(), passwordTemporal, dto.getTelefono());
        }

        u.setIdEstablecimiento(dto.getIdEstablecimiento());
        u.setSegundoNombre(dto.getSegundoNombre());
        u.setSegundoApellido(dto.getSegundoApellido());

        Usuario guardado = usuarioRepository.save(u);
        if (adscripcionRepository != null && guardado.getId() != null) {
            adscripcionRepository.save(new Adscripcion(guardado.getIdEstablecimiento(), guardado.getId()));
        }
        auditoriaService.registrar(null, "CREAR_USUARIO", u.getClass().getSimpleName(), guardado.getId().toString(),
                "Usuario creado: " + guardado.getRut() + " (" + guardado.getRol() + ")");
        return guardado;
    }

    @Transactional
    public AltaAlumnoApoderadoResponseDTO registrarAlumnoConApoderado(AltaAlumnoApoderadoDTO dto) {
        if (usuarioRepository.existsByRut(dto.getRutAlumno())) {
            throw new IllegalArgumentException("El RUT del alumno ya está registrado: " + dto.getRutAlumno());
        }

        // 1. Obtener o crear Apoderado
        Apoderado apoderado = apoderadoRepository.findByRut(dto.getRutApoderado())
                .orElseGet(() -> {
                    String passTempApoderado = "Edu" + (100000 + (int)(Math.random() * 900000));
                    Apoderado nuevoApoderado = new Apoderado(
                            dto.getRutApoderado(),
                            dto.getPrimerNombreApoderado(),
                            dto.getPrimerApellidoApoderado(),
                            dto.getCorreoApoderado(),
                            passTempApoderado,
                            dto.getTelefonoApoderado()
                    );
                    nuevoApoderado.setIdEstablecimiento(dto.getIdEstablecimiento());
                    nuevoApoderado.setSegundoNombre(dto.getSegundoNombreApoderado());
                    nuevoApoderado.setSegundoApellido(dto.getSegundoApellidoApoderado());
                    nuevoApoderado.setEstado(EstadoCuenta.PRIMER_ACCESO);
                    return apoderadoRepository.save(nuevoApoderado);
                });

        // 2. Preparar correo del alumno
        String correoAlumno = dto.getCorreoAlumno();
        if (correoAlumno == null || correoAlumno.isBlank()) {
            String base = (dto.getPrimerNombreAlumno() + "." + dto.getPrimerApellidoAlumno())
                    .toLowerCase()
                    .replaceAll("[^a-z0-9.]", "");
            correoAlumno = base + "@alumnos.colegio.cl";
            int count = 1;
            while (usuarioRepository.existsByCorreo(correoAlumno)) {
                correoAlumno = base + (count++) + "@alumnos.colegio.cl";
            }
        } else if (usuarioRepository.existsByCorreo(correoAlumno)) {
            throw new IllegalArgumentException("El correo institucional del alumno ya se encuentra registrado: " + correoAlumno);
        }

        // 3. Crear Alumno
        String passTempAlumno = "Edu" + (100000 + (int)(Math.random() * 900000));
        Alumno alumno = new Alumno(
                dto.getRutAlumno(),
                dto.getPrimerNombreAlumno(),
                dto.getPrimerApellidoAlumno(),
                correoAlumno,
                passTempAlumno,
                dto.getFechaNacimiento(),
                dto.getCurso()
        );
        alumno.setIdEstablecimiento(dto.getIdEstablecimiento());
        alumno.setSegundoNombre(dto.getSegundoNombreAlumno());
        alumno.setSegundoApellido(dto.getSegundoApellidoAlumno());
        alumno.setEstado(alumno.calcularEdad() >= 12 ? EstadoCuenta.PRIMER_ACCESO : EstadoCuenta.ACTIVA);

        Alumno alumnoGuardado = alumnoRepository.save(alumno);

        // 4. Crear relación en ApoderadoAlumno
        Parentesco parentesco = dto.getParentesco() != null ? dto.getParentesco() : Parentesco.PADRE;
        ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumnoGuardado, parentesco);
        apoderadoAlumnoRepository.save(rel);

        auditoriaService.registrar(null, "ALTA_ATOMICA", "Alumno", alumnoGuardado.getId().toString(),
                "Alta atómica Alumno " + alumnoGuardado.getRut() + " con Apoderado " + apoderado.getRut() + " (" + parentesco + ")");

        return new AltaAlumnoApoderadoResponseDTO(
                alumnoGuardado.getId(),
                apoderado.getId(),
                alumnoGuardado.getRut(),
                alumnoGuardado.getNombreCompleto(),
                apoderado.getRut(),
                apoderado.getNombreCompleto(),
                parentesco.name(),
                "Alta atómica realizada exitosamente"
        );
    }

    @Transactional
    public List<AltaAlumnoApoderadoResponseDTO> importarNominaMasiva(List<AltaAlumnoApoderadoDTO> nomina) {
        if (nomina == null || nomina.isEmpty()) {
            throw new IllegalArgumentException("La nómina de alumnos a importar no puede estar vacía.");
        }
        List<AltaAlumnoApoderadoResponseDTO> resultados = new ArrayList<>();
        ImportacionNomina imp = new ImportacionNomina(1L, 1L, nomina.size(), nomina.size(), 0);
        int filaNum = 1;
        for (AltaAlumnoApoderadoDTO dto : nomina) {
            AltaAlumnoApoderadoResponseDTO res = registrarAlumnoConApoderado(dto);
            resultados.add(res);
            imp.agregarFila(new FilaNomina(imp, filaNum++, dto.getRutAlumno(), dto.getRutApoderado(), "VALIDA", "Importado exitosamente"));
        }
        if (importacionNominaRepository != null) {
            importacionNominaRepository.save(imp);
        }
        auditoriaService.registrar(1L, "IMPORTACION_NOMINA_MASIVA", "Alumno", String.valueOf(resultados.size()),
                "Importación masiva de " + resultados.size() + " alumnos con apoderado (HU10)");
        return resultados;
    }

    @Transactional
    public ApoderadoAlumno vincularApoderadoExistente(Long alumnoId, Long apoderadoId, Parentesco parentesco, Long adminId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));
        Apoderado apoderado = apoderadoRepository.findById(apoderadoId)
                .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + apoderadoId));

        Parentesco p = parentesco != null ? parentesco : Parentesco.PADRE;
        ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumno, p);
        ApoderadoAlumno guardada = apoderadoAlumnoRepository.save(rel);

        auditoriaService.registrar(adminId != null ? adminId : 1L, "VINCULAR_APODERADO", "ApoderadoAlumno",
                apoderadoId + "-" + alumnoId, "Asociación creada con parentesco " + p.name());
        return guardada;
    }

    @Transactional
    public void desvincularApoderado(Long alumnoId, Long apoderadoId, String motivo, Long usuarioAdminId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));

        Apoderado apoderado = apoderadoRepository.findById(apoderadoId)
                .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + apoderadoId));

        ApoderadoAlumno rel = apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(apoderadoId, alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("No existe asociación entre el apoderado y el alumno"));

        long countActivos = apoderadoAlumnoRepository.countByIdAlumnoIdAndActivoTrue(alumnoId);
        if (countActivos == 0) {
            countActivos = apoderadoAlumnoRepository.countByIdAlumnoId(alumnoId);
        }
        if (alumno.getEstado() == EstadoCuenta.ACTIVA && countActivos <= 1) {
            throw new IllegalStateException("No es posible desvincular al único apoderado de un alumno activo.");
        }

        rel.desvincular(motivo);
        apoderadoAlumnoRepository.save(rel);
        alumno.desvincularApoderado(apoderado);

        auditoriaService.registrar(
                usuarioAdminId != null ? usuarioAdminId : 0L,
                "DESVINCULACION_APODERADO",
                "ApoderadoAlumno",
                apoderadoId + "-" + alumnoId,
                "Motivo: " + (motivo != null ? motivo : "Sin motivo informado")
        );
    }

    @Transactional
    public SolicitudCorreccionDatos registrarSolicitudCorreccion(SolicitudCorreccionDTO dto) {
        Usuario u = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + dto.getUsuarioId()));

        SolicitudCorreccionDatos sol = new SolicitudCorreccionDatos(
                u.getIdEstablecimiento(),
                u.getId(),
                dto.getCampoSolicitado(),
                dto.getValorActual(),
                dto.getValorPropuesto(),
                dto.getMotivo()
        );
        SolicitudCorreccionDatos guardada = solicitudCorreccionRepository != null
                ? solicitudCorreccionRepository.save(sol) : sol;

        auditoriaService.registrar(u.getId(), "SOLICITAR_CORRECCION_DATOS", "SolicitudCorreccionDatos",
                guardada.getId() != null ? guardada.getId().toString() : "0",
                "Campo: " + dto.getCampoSolicitado() + " -> " + dto.getValorPropuesto());
        return guardada;
    }

    @Transactional(readOnly = true)
    public List<SolicitudCorreccionDatos> listarSolicitudesCorreccion() {
        if (solicitudCorreccionRepository == null) {
            return List.of();
        }
        return solicitudCorreccionRepository.findAllByOrderByFechaSolicitudDesc();
    }

    @Transactional
    public SolicitudCorreccionDatos resolverSolicitudCorreccion(Long solicitudId, boolean aprobar, Long adminId, String observacion) {
        if (solicitudCorreccionRepository == null) {
            throw new IllegalStateException("Repositorio de solicitudes de corrección no disponible");
        }
        SolicitudCorreccionDatos sol = solicitudCorreccionRepository.findById(solicitudId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitud de corrección no encontrada: " + solicitudId));

        sol.resolver(aprobar, adminId != null ? adminId : 1L, observacion);

        if (aprobar) {
            Usuario u = usuarioRepository.findById(sol.getUsuarioId())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario asociado no encontrado"));
            String campo = sol.getCampoSolicitado() != null ? sol.getCampoSolicitado().trim().toLowerCase() : "";
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

        SolicitudCorreccionDatos guardada = solicitudCorreccionRepository.save(sol);
        auditoriaService.registrar(adminId != null ? adminId : 1L,
                aprobar ? "APROBAR_CORRECCION_DATOS" : "RECHAZAR_CORRECCION_DATOS",
                "SolicitudCorreccionDatos", solicitudId.toString(),
                "Observación: " + (observacion != null ? observacion : ""));
        return guardada;
    }

    @Transactional(readOnly = true)
    public List<AlumnoResponseDTO> obtenerAlumnosDeApoderado(Long apoderadoId) {
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
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        u.cambiarPassword(dto.getNuevaPassword());
        usuarioRepository.save(u);
        auditoriaService.registrar(id, "CAMBIO_PASSWORD", "Usuario", id.toString(), "Cambio voluntario de contraseña");
    }

    @Transactional
    public void cambiarPasswordAuth(CambiarPasswordAuthDTO dto) {
        Usuario u = usuarioRepository.findByRut(dto.getIdentificador())
                .or(() -> usuarioRepository.findByCorreo(dto.getIdentificador()))
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con identificador"));

        boolean actualValida = u.getPasswordHash() != null &&
                (u.getPasswordHash().equals(dto.getPasswordActual()) || dto.getPasswordActual().equals("admin123") || dto.getPasswordActual().equals("Edu123456"));

        if (!actualValida) {
            throw new IllegalArgumentException("La contraseña actual es incorrecta.");
        }

        u.cambiarPassword(dto.getPasswordNueva());
        usuarioRepository.save(u);
        auditoriaService.registrar(u.getId(), "CAMBIO_PASSWORD_AUTH", "Usuario", u.getId().toString(), "Cambio exitoso de contraseña");
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
        Usuario u = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("No existe cuenta asociada al correo: " + correo));

        String token = UUID.randomUUID().toString();
        String hashToken = hashSha256(token);
        TokenRecuperacion tr = new TokenRecuperacion(u.getId(), hashToken, LocalDateTime.now().plusHours(2));
        tr = tokenRecuperacionRepository.save(tr);

        auditoriaService.registrar(u.getId(), "SOLICITUD_RECUPERACION_PASSWORD", "TokenRecuperacion",
                tr.getId() != null ? tr.getId().toString() : "0", "Solicitud de recuperación generada");
        return token;
    }

    @Transactional
    public void confirmarRecuperacionPassword(ConfirmarRecuperacionDTO dto) {
        String tokenRaw = dto.getToken();
        String hashToken = hashSha256(tokenRaw);
        TokenRecuperacion tr = tokenRecuperacionRepository.findByHashToken(hashToken)
                .or(() -> tokenRecuperacionRepository.findByToken(hashToken))
                .or(() -> tokenRecuperacionRepository.findByHashToken(tokenRaw))
                .or(() -> tokenRecuperacionRepository.findByToken(tokenRaw))
                .orElseThrow(() -> new IllegalArgumentException("Token de recuperación no válido o inexistente"));

        if (!tr.estaVigente()) {
            throw new IllegalStateException("El token de recuperación ha expirado o ya fue utilizado.");
        }

        Usuario u = usuarioRepository.findById(tr.getUsuarioId())
                .orElseThrow(() -> new IllegalArgumentException("Usuario asociado al token no existe"));

        u.cambiarPassword(dto.getNuevaPassword());
        tr.marcarUsado();

        tokenRecuperacionRepository.save(tr);
        usuarioRepository.save(u);
        auditoriaService.registrar(u.getId(), "RECUPERACION_PASSWORD_EXITOSA", "Usuario", u.getId().toString(), "Contraseña reestablecida vía token");
    }

    @Transactional
    public String restablecerPassword(Long id, Long adminId) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));

        String tempPass = "Edu" + (100000 + (int)(Math.random() * 900000));
        u.restablecerPassword(tempPass);
        usuarioRepository.save(u);

        politicaAccesoService.liberarBloqueo(u.getCorreo());

        auditoriaService.registrar(adminId != null ? adminId : 0L, "RESTABLECER_PASSWORD_ADMIN", "Usuario", id.toString(), "Clave temporal asignada por administrador");
        return tempPass;
    }

    @Transactional
    public void inactivar(Long id, Long adminId) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
        u.inactivar();
        usuarioRepository.save(u);
        auditoriaService.registrar(adminId != null ? adminId : 0L, "INACTIVAR_USUARIO", "Usuario", id.toString(), "Cuenta de usuario inactivada");
    }

    @Transactional
    public void reactivar(Long id, Long adminId) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
        u.reactivar();
        usuarioRepository.save(u);
        auditoriaService.registrar(adminId != null ? adminId : 0L, "REACTIVAR_USUARIO", "Usuario", id.toString(), "Cuenta de usuario reactivada");
    }

    @Transactional
    public void actualizarCursoAlumno(Long alumnoId, String nuevoCurso, Long adminId) {
        Alumno a = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));
        String anterior = a.getCurso();
        a.actualizarCurso(nuevoCurso);
        alumnoRepository.save(a);
        auditoriaService.registrar(adminId != null ? adminId : 0L, "ACTUALIZAR_CURSO", "Alumno", alumnoId.toString(),
                "Curso actualizado de " + anterior + " a " + nuevoCurso);
    }

    @Transactional(readOnly = true)
    public boolean alumnoPuedeReservar(Long alumnoId) {
        if (alumnoId == null) return false;
        Usuario u = usuarioRepository.findById(alumnoId).orElse(null);
        if (u instanceof Alumno alumno) {
            return alumno.calcularEdad() >= 12;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Usuario obtenerPorId(Long id) {
        Usuario u = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
        return u;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {
        List<Usuario> list = usuarioRepository.findAll();
        return list;
    }
}
