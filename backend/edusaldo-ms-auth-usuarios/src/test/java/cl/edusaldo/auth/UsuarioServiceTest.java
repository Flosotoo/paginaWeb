package cl.edusaldo.auth;

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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas Unitarias de UsuarioService")
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AlumnoRepository alumnoRepository;
    @Mock
    private ApoderadoRepository apoderadoRepository;
    @Mock
    private ApoderadoAlumnoRepository apoderadoAlumnoRepository;
    @Mock
    private PoliticaAccesoService politicaAccesoService;
    @Mock
    private AuditoriaService auditoriaService;
    @Mock
    private TokenRecuperacionRepository tokenRecuperacionRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    private Usuario usuarioPrueba;

    @BeforeEach
    void setUp() {
        usuarioPrueba = new Administrador("15.666.777-8", "Antonio", "Jara", "admin@colegio.cl", "hash_secreto_123");
        usuarioPrueba.setId(1L);
        usuarioPrueba.setEstado(EstadoCuenta.ACTIVA);
    }

    @Test
    @DisplayName("1. Bloqueo de cuenta dinámico tras intentos consecutivos fallidos (HU10)")
    void testBloqueoDinamicoIntentosFallidos() {
        when(usuarioRepository.findByRut("15.666.777-8")).thenReturn(Optional.of(usuarioPrueba));
        doThrow(new IllegalStateException("Cuenta bloqueada temporalmente por superar el límite de 5 intentos fallidos"))
                .when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

        LoginRequestDTO dto = new LoginRequestDTO("15.666.777-8", "clave_incorrecta");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> usuarioService.login(dto));
        assertTrue(ex.getMessage().contains("bloqueada temporalmente"));

        // Se preserva el estado de cuenta original (no se muta a BLOQUEADA)
        assertEquals(EstadoCuenta.ACTIVA, usuarioPrueba.getEstado());
    }

    @Test
    @DisplayName("2. Login exitoso registra acceso y actualiza último acceso (HU06)")
    void testLoginExitosoReseteaIntentos() {
        when(usuarioRepository.findByRut("15.666.777-8")).thenReturn(Optional.of(usuarioPrueba));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));
        doNothing().when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

        LoginRequestDTO dtoCorrecto = new LoginRequestDTO("15.666.777-8", "hash_secreto_123");
        LoginResponseDTO res = usuarioService.login(dtoCorrecto);

        assertNotNull(res.getToken());
        assertNotNull(usuarioPrueba.getUltimoAcceso());
        verify(politicaAccesoService, times(1)).registrarIntento("admin@colegio.cl", true);
    }

    @Test
    @DisplayName("3. Creación de nuevo usuario inicia en estado PRIMER_ACCESO con clave temporal (HU05)")
    void testCrearUsuarioNuevoQuedaPrimerAcceso() {
        when(usuarioRepository.existsByRut("11.222.333-4")).thenReturn(false);
        when(usuarioRepository.existsByCorreo("marta@colegio.cl")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> {
            Usuario u = i.getArgument(0);
            u.setId(2L);
            return u;
        });

        CrearUsuarioDTO dto = new CrearUsuarioDTO();
        dto.setRut("11.222.333-4");
        dto.setPrimerNombre("Marta");
        dto.setPrimerApellido("Gómez");
        dto.setCorreo("marta@colegio.cl");
        dto.setRol(Rol.ENCARGADO);

        Usuario creado = usuarioService.crearUsuario(dto);

        assertNotNull(creado.getId());
        assertEquals(EstadoCuenta.PRIMER_ACCESO, creado.getEstado());
        assertTrue(creado.getPasswordHash().startsWith("Edu"));
        assertTrue(creado instanceof Encargado);
    }

    @Test
    @DisplayName("4. Inactivación y reactivación lógica de usuario preserva el historial (HU13)")
    void testInactivarYReactivarUsuario() {
        when(usuarioRepository.findById(1L)).thenReturn(Optional.of(usuarioPrueba));
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(i -> i.getArgument(0));

        usuarioService.inactivar(1L, 1L);
        assertEquals(EstadoCuenta.INACTIVA, usuarioPrueba.getEstado());

        usuarioService.reactivar(1L, 1L);
        assertEquals(EstadoCuenta.ACTIVA, usuarioPrueba.getEstado());
    }
}
