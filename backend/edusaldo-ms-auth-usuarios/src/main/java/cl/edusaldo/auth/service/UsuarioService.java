package cl.edusaldo.auth.service;

import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final AlumnoRepository alumnoRepository;
    private final ApoderadoRepository apoderadoRepository;
    private final ApoderadoAlumnoRepository apoderadoAlumnoRepository;
    private final PoliticaAccesoService politicaAccesoService;
    private final AuditoriaService auditoriaService;
    private final TokenRecuperacionRepository tokenRecuperacionRepository;

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
            // Reevaluar si este fallo excedió el límite para lanzar IllegalStateException de bloqueo
            try {
                politicaAccesoService.evaluarBloqueo(usuario.getCorreo());
            } catch (IllegalStateException ex) {
                throw ex;
            }
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
                usuario.getRut(),
                usuario.getNombreCompleto(),
                usuario.getCorreo(),
                usuario.getRol(),
                usuario.getEstado()
        );
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

        u.setSegundoNombre(dto.getSegundoNombre());
        u.setSegundoApellido(dto.getSegundoApellido());

        Usuario guardado = usuarioRepository.save(u);
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
        alumno.setSegundoNombre(dto.getSegundoNombreAlumno());
        alumno.setSegundoApellido(dto.getSegundoApellidoAlumno());
        alumno.setEstado(alumno.calcularEdad() >= 12 ? EstadoCuenta.PRIMER_ACCESO : EstadoCuenta.ACTIVA);

        Alumno alumnoGuardado = alumnoRepository.save(alumno);

        // 4. Crear relación pura en ApoderadoAlumno
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
    public void desvincularApoderado(Long alumnoId, Long apoderadoId, String motivo, Long usuarioAdminId) {
        Alumno alumno = alumnoRepository.findById(alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("Alumno no encontrado con ID: " + alumnoId));

        Apoderado apoderado = apoderadoRepository.findById(apoderadoId)
                .orElseThrow(() -> new IllegalArgumentException("Apoderado no encontrado con ID: " + apoderadoId));

        ApoderadoAlumno rel = apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(apoderadoId, alumnoId)
                .orElseThrow(() -> new IllegalArgumentException("No existe asociación entre el apoderado y el alumno"));

        if (alumno.getEstado() == EstadoCuenta.ACTIVA && apoderadoAlumnoRepository.countByIdAlumnoId(alumnoId) <= 1) {
            throw new IllegalStateException("No es posible desvincular al único apoderado de un alumno activo.");
        }

        // Eliminación física pura de la relación en base de datos
        apoderadoAlumnoRepository.delete(rel);
        alumno.desvincularApoderado(apoderado);

        auditoriaService.registrar(
                usuarioAdminId != null ? usuarioAdminId : 0L,
                "DESVINCULACION_APODERADO",
                "ApoderadoAlumno",
                apoderadoId + "-" + alumnoId,
                "Motivo: " + (motivo != null ? motivo : "Sin motivo informado")
        );
    }

    @Transactional(readOnly = true)
    public List<AlumnoResponseDTO> obtenerAlumnosDeApoderado(Long apoderadoId) {
        List<ApoderadoAlumno> asociaciones = apoderadoAlumnoRepository.findByIdApoderadoId(apoderadoId);
        List<AlumnoResponseDTO> result = new ArrayList<>();
        for (ApoderadoAlumno rel : asociaciones) {
            if (rel.getAlumno() != null) {
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

    @Transactional
    public String solicitarRecuperacionPassword(String correo) {
        Usuario u = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new IllegalArgumentException("No existe cuenta asociada al correo: " + correo));

        String token = UUID.randomUUID().toString();
        TokenRecuperacion tr = new TokenRecuperacion(u.getId(), token, LocalDateTime.now().plusHours(2));
        tokenRecuperacionRepository.save(tr);

        auditoriaService.registrar(u.getId(), "SOLICITUD_RECUPERACION_PASSWORD", "TokenRecuperacion", token, "Token de recuperación generado");
        return token;
    }

    @Transactional
    public void confirmarRecuperacionPassword(ConfirmarRecuperacionDTO dto) {
        TokenRecuperacion tr = tokenRecuperacionRepository.findByToken(dto.getToken())
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

        // Desbloquear si tenía bloqueo dinámico
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
    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarTodos() {
        return usuarioRepository.findAll();
    }
}
