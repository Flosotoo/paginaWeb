package cl.edusaldo.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import cl.edusaldo.auth.dto.CrearUsuarioDTO;
import cl.edusaldo.auth.dto.LoginRequestDTO;
import cl.edusaldo.auth.dto.LoginResponseDTO;
import cl.edusaldo.auth.model.Administrador;
import cl.edusaldo.auth.model.Encargado;
import cl.edusaldo.auth.model.EstadoCuenta;
import cl.edusaldo.auth.model.Rol;
import cl.edusaldo.auth.model.Usuario;
import cl.edusaldo.auth.repository.AlumnoRepository;
import cl.edusaldo.auth.repository.ApoderadoAlumnoRepository;
import cl.edusaldo.auth.repository.ApoderadoRepository;
import cl.edusaldo.auth.repository.TokenRecuperacionRepository;
import cl.edusaldo.auth.repository.UsuarioRepository;
import cl.edusaldo.auth.service.AuditoriaService;
import cl.edusaldo.auth.service.PoliticaAccesoService;
import cl.edusaldo.auth.service.UsuarioService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias de UsuarioService")
class UsuarioServiceTest {

  @Mock private UsuarioRepository usuarioRepository;
  @Mock private AlumnoRepository alumnoRepository;
  @Mock private ApoderadoRepository apoderadoRepository;
  @Mock private ApoderadoAlumnoRepository apoderadoAlumnoRepository;
  @Mock private PoliticaAccesoService politicaAccesoService;
  @Mock private AuditoriaService auditoriaService;
  @Mock private TokenRecuperacionRepository tokenRecuperacionRepository;

  @InjectMocks private UsuarioService usuarioService;

  private Usuario usuarioPrueba;

  @Test
  void alumnoNoSeInactivaSinUnCierreDeSaldoSeguro() {
    var alumno = new cl.edusaldo.auth.model.Alumno();
    alumno.setId(42L);
    alumno.setEstado(EstadoCuenta.ACTIVA);
    when(usuarioRepository.findById(42L)).thenReturn(Optional.of(alumno));
    assertThrows(IllegalStateException.class, () -> usuarioService.inactivar(42L, 1L));
    assertEquals(EstadoCuenta.ACTIVA, alumno.getEstado());
    verify(usuarioRepository, never()).save(any());
  }

  @BeforeEach
  void setUp() {
    usuarioPrueba =
        new Administrador(
            "15666777-3", "Antonio", "Navarro", "admin@colegio.cl", "hash_secreto_123");
    usuarioPrueba.setId(1L);
    usuarioPrueba.setEstado(EstadoCuenta.ACTIVA);
  }

  @Test
  @DisplayName("1. Bloqueo de cuenta dinámico tras intentos consecutivos fallidos")
  void testBloqueoDinamicoIntentosFallidos() {
    when(usuarioRepository.findByRut("15666777-3")).thenReturn(Optional.of(usuarioPrueba));
    doThrow(
            new IllegalStateException(
                "Cuenta bloqueada temporalmente por superar el límite de 5 intentos fallidos"))
        .when(politicaAccesoService)
        .evaluarBloqueo("admin@colegio.cl");

    LoginRequestDTO dto = new LoginRequestDTO("15666777-3", "clave_incorrecta");

    IllegalStateException ex =
        assertThrows(IllegalStateException.class, () -> usuarioService.login(dto));
    assertTrue(ex.getMessage().contains("bloqueada temporalmente"));

    assertEquals(EstadoCuenta.ACTIVA, usuarioPrueba.getEstado());
  }

  @Test
  @DisplayName("2. Login exitoso registra acceso y actualiza último acceso")
  void testLoginExitosoReseteaIntentos() {
    when(usuarioRepository.findByRut("15666777-3")).thenReturn(Optional.of(usuarioPrueba));
    when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));
    doNothing().when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

    LoginRequestDTO dtoCorrecto = new LoginRequestDTO("15666777-3", "hash_secreto_123");
    LoginResponseDTO res = usuarioService.login(dtoCorrecto);

    assertNotNull(res.getToken());
    assertNotNull(usuarioPrueba.getUltimoAcceso());
    verify(politicaAccesoService, times(1)).registrarIntento("admin@colegio.cl", true);
  }

  @Test
  @DisplayName("3. Creación de nuevo usuario inicia en estado PRIMER_ACCESO con clave temporal")
  void testCrearUsuarioNuevoQuedaPrimerAcceso() {
    when(usuarioRepository.existsByRut("11222333-9")).thenReturn(false);
    when(usuarioRepository.existsByCorreo("marta@colegio.cl")).thenReturn(false);
    when(usuarioRepository.save(any(Usuario.class)))
        .thenAnswer(
            i -> {
              Usuario u = i.getArgument(0);
              u.setId(2L);
              return u;
            });

    CrearUsuarioDTO dto = new CrearUsuarioDTO();
    dto.setRut("11222333-9");
    dto.setPrimerNombre("Marta");
    dto.setPrimerApellido("Gómez");
    dto.setCorreo("marta@colegio.cl");
    dto.setRol(Rol.ENCARGADO);

    Usuario creado = usuarioService.crearUsuario(dto);

    assertNotNull(creado.getId());
    assertEquals(EstadoCuenta.PRIMER_ACCESO, creado.getEstado());
    assertTrue(creado.getPasswordHash().startsWith("pbkdf2$"));
    assertFalse(
        cl.edusaldo.auth.service.PasswordCodec.matches("admin123", creado.getPasswordHash()));
    assertFalse(
        cl.edusaldo.auth.service.PasswordCodec.matches("Edu123456", creado.getPasswordHash()));
    assertTrue(creado instanceof Encargado);
  }

  @Test
  @DisplayName("4. Inactivación y reactivación lógica de usuario preserva el historial")
  void testInactivarYReactivarUsuario() {
    when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));
    when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

    usuarioService.inactivar(1L, 1L);
    assertEquals(EstadoCuenta.INACTIVA, usuarioPrueba.getEstado());

    usuarioService.reactivar(1L, 1L);
    assertEquals(EstadoCuenta.ACTIVA, usuarioPrueba.getEstado());
  }

  @Test
  @DisplayName("5. Actualizar datos y curso de alumno valida tipos, unicidad y establecimiento")
  void testActualizarDatosYCursoAlumno() {
    var alumno =
        new cl.edusaldo.auth.model.Alumno(
            "23456789-6",
            "Tomás",
            "Pérez",
            "tomas.perez@alumnos.colegio.cl",
            "clave123",
            java.time.LocalDate.of(2012, 4, 15),
            "7° Básico A");
    alumno.setId(4L);
    alumno.setIdEstablecimiento(1L);
    when(alumnoRepository.findById(4L)).thenReturn(Optional.of(alumno));
    when(usuarioRepository.findByRut("23456789-6")).thenReturn(Optional.of(alumno));
    when(usuarioRepository.findByCorreo("tomas.nuevo@alumnos.colegio.cl"))
        .thenReturn(Optional.empty());

    usuarioService.actualizarDatosAlumno(
        4L,
        java.util.Map.of(
            "idEstablecimiento", "1",
            "rut", "23.456.789-6",
            "primerNombre", "Tomás Ignacio",
            "primerApellido", "Pérez Gómez",
            "correo", "tomas.nuevo@alumnos.colegio.cl",
            "fechaNacimiento", "2012-05-20",
            "curso", "8° Básico A"),
        1L);

    assertEquals("23456789-6", alumno.getRut());
    assertEquals("Tomás Ignacio", alumno.getPrimerNombre());
    assertEquals("Pérez Gómez", alumno.getPrimerApellido());
    assertEquals("tomas.nuevo@alumnos.colegio.cl", alumno.getCorreo());
    assertEquals(java.time.LocalDate.of(2012, 5, 20), alumno.getFechaNacimiento());
    assertEquals("8° Básico A", alumno.getCurso());
    verify(alumnoRepository).save(alumno);
  }

  @Test
  @DisplayName("6. Actualizar datos de alumno rechaza RUT inválido, duplicado o fecha futura sin guardar")
  void testActualizarDatosAlumnoRechazaInvalidos() {
    var alumno =
        new cl.edusaldo.auth.model.Alumno(
            "23456789-6",
            "Tomás",
            "Pérez",
            "tomas.perez@alumnos.colegio.cl",
            "clave123",
            java.time.LocalDate.of(2012, 4, 15),
            "7° Básico A");
    alumno.setId(4L);
    alumno.setIdEstablecimiento(1L);
    when(alumnoRepository.findById(4L)).thenReturn(Optional.of(alumno));
    when(usuarioRepository.findByRut("15666777-3")).thenReturn(Optional.of(usuarioPrueba));

    assertThrows(
        IllegalArgumentException.class,
        () -> usuarioService.actualizarDatosAlumno(4L, java.util.Map.of("rut", "23456789-0"), 1L));
    assertThrows(
        IllegalArgumentException.class,
        () -> usuarioService.actualizarDatosAlumno(4L, java.util.Map.of("rut", "15666777-3"), 1L));
    assertThrows(
        IllegalArgumentException.class,
        () ->
            usuarioService.actualizarDatosAlumno(
                4L,
                java.util.Map.of(
                    "fechaNacimiento", java.time.LocalDate.now().plusDays(1).toString()),
                1L));
    assertThrows(
        IllegalArgumentException.class,
        () -> usuarioService.actualizarDatosAlumno(4L, java.util.Map.of("curso", "   "), 1L));
    verify(alumnoRepository, never()).save(any());
  }
}
