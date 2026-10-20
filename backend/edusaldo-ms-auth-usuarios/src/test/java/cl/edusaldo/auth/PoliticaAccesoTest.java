package cl.edusaldo.auth;

import cl.edusaldo.auth.dto.LoginRequestDTO;
import cl.edusaldo.auth.dto.LoginResponseDTO;
import cl.edusaldo.auth.model.Administrador;
import cl.edusaldo.auth.model.EstadoCuenta;
import cl.edusaldo.auth.model.PoliticaAcceso;
import cl.edusaldo.auth.repository.IntentoAccesoRepository;
import cl.edusaldo.auth.repository.PoliticaAccesoRepository;
import cl.edusaldo.auth.repository.UsuarioRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas de Bloqueo Dinámico por Política de Acceso (HU10)")
class PoliticaAccesoTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private PoliticaAccesoService politicaAccesoService;

    @InjectMocks
    private UsuarioService usuarioService;

    private Administrador usuarioPrueba;

    @BeforeEach
    void setUp() {
        usuarioPrueba = new Administrador("15.666.777-8", "Antonio", "Jara", "admin@colegio.cl", "hash_secreto_123");
        usuarioPrueba.setId(1L);
        usuarioPrueba.setEstado(EstadoCuenta.ACTIVA);
    }

    @Test
    @DisplayName("PoliticaAcceso bloquea dinámicamente si se superan 5 intentos sin mutar EstadoCuenta")
    void testBloqueoDinamicoSinMutarEstado() {
        when(usuarioRepository.findByRut("admin@colegio.cl")).thenReturn(Optional.empty());
        when(usuarioRepository.findByCorreo("admin@colegio.cl")).thenReturn(Optional.of(usuarioPrueba));

        // Simulamos que la política indica bloqueo vigente
        doThrow(new IllegalStateException("Cuenta bloqueada temporalmente por superar intentos fallidos"))
                .when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

        LoginRequestDTO dto = new LoginRequestDTO("admin@colegio.cl", "cualquier_password");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> usuarioService.login(dto));
        assertTrue(ex.getMessage().contains("bloqueada temporalmente"));

        // El usuario NUNCA debe cambiar su EstadoCuenta a un valor inexistente BLOQUEADA
        assertEquals(EstadoCuenta.ACTIVA, usuarioPrueba.getEstado());
        verify(usuarioRepository, never()).save(usuarioPrueba);
    }

    @Test
    @DisplayName("Credencial incorrecta registra intento fallido en PoliticaAccesoService")
    void testCredencialIncorrectaRegistraIntentoFallido() {
        when(usuarioRepository.findByRut("admin@colegio.cl")).thenReturn(Optional.empty());
        when(usuarioRepository.findByCorreo("admin@colegio.cl")).thenReturn(Optional.of(usuarioPrueba));
        doNothing().when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

        LoginRequestDTO dto = new LoginRequestDTO("admin@colegio.cl", "password_invalida_xyz");

        assertThrows(IllegalArgumentException.class, () -> usuarioService.login(dto));
        verify(politicaAccesoService, times(1)).registrarIntento("admin@colegio.cl", false);
    }

    @Test
    @DisplayName("Login exitoso registra intento exitoso en PoliticaAccesoService")
    void testLoginExitosoRegistraExito() {
        when(usuarioRepository.findByRut("admin@colegio.cl")).thenReturn(Optional.empty());
        when(usuarioRepository.findByCorreo("admin@colegio.cl")).thenReturn(Optional.of(usuarioPrueba));
        doNothing().when(politicaAccesoService).evaluarBloqueo("admin@colegio.cl");

        LoginRequestDTO dto = new LoginRequestDTO("admin@colegio.cl", "hash_secreto_123");

        LoginResponseDTO res = usuarioService.login(dto);

        assertNotNull(res);
        assertNotNull(res.getToken());
        verify(politicaAccesoService, times(1)).registrarIntento("admin@colegio.cl", true);
    }
}
