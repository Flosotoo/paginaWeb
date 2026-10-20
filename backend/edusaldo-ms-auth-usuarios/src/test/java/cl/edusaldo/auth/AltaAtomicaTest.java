package cl.edusaldo.auth;

import cl.edusaldo.auth.dto.AltaAlumnoApoderadoDTO;
import cl.edusaldo.auth.dto.AltaAlumnoApoderadoResponseDTO;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import cl.edusaldo.auth.service.AuditoriaService;
import cl.edusaldo.auth.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas de Alta Atómica HU15 y Desvinculación HU16 con Auditoría")
class AltaAtomicaTest {

    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private AlumnoRepository alumnoRepository;
    @Mock
    private ApoderadoRepository apoderadoRepository;
    @Mock
    private ApoderadoAlumnoRepository apoderadoAlumnoRepository;
    @Mock
    private AuditoriaService auditoriaService;

    @InjectMocks
    private UsuarioService usuarioService;

    private AltaAlumnoApoderadoDTO dtoAlta;

    @BeforeEach
    void setUp() {
        dtoAlta = new AltaAlumnoApoderadoDTO();
        dtoAlta.setRutAlumno("24.111.222-3");
        dtoAlta.setPrimerNombreAlumno("Tomás");
        dtoAlta.setPrimerApellidoAlumno("González");
        dtoAlta.setFechaNacimiento(LocalDate.of(2012, 5, 15));
        dtoAlta.setCurso("7° Básico");
        dtoAlta.setRutApoderado("16.333.444-5");
        dtoAlta.setPrimerNombreApoderado("Carlos");
        dtoAlta.setPrimerApellidoApoderado("González");
        dtoAlta.setCorreoApoderado("carlos.gonzalez@gmail.com");
        dtoAlta.setTelefonoApoderado("+56912345678");
        dtoAlta.setParentesco(Parentesco.PADRE);
    }

    @Test
    @DisplayName("Alta atómica exitosa crea Alumno, Apoderado y relación ApoderadoAlumno")
    void testAltaAtomicaExitosa() {
        when(usuarioRepository.existsByRut("24.111.222-3")).thenReturn(false);
        when(apoderadoRepository.findByRut("16.333.444-5")).thenReturn(Optional.empty());

        Apoderado apoderadoGuardado = new Apoderado("16.333.444-5", "Carlos", "González", "carlos.gonzalez@gmail.com", "hashTemp", "+56912345678");
        apoderadoGuardado.setId(10L);
        when(apoderadoRepository.save(any(Apoderado.class))).thenReturn(apoderadoGuardado);

        Alumno alumnoGuardado = new Alumno("24.111.222-3", "Tomás", "González", "tomas.gonzalez@alumnos.colegio.cl", "hashTemp", LocalDate.of(2012, 5, 15), "7° Básico");
        alumnoGuardado.setId(20L);
        when(alumnoRepository.save(any(Alumno.class))).thenReturn(alumnoGuardado);

        when(apoderadoAlumnoRepository.save(any(ApoderadoAlumno.class))).thenAnswer(i -> i.getArgument(0));

        AltaAlumnoApoderadoResponseDTO resp = usuarioService.registrarAlumnoConApoderado(dtoAlta);

        assertNotNull(resp);
        assertEquals(20L, resp.getAlumnoId());
        assertEquals(10L, resp.getApoderadoId());
        assertEquals("Tomás González", resp.getNombreAlumno());
        assertEquals("Carlos González", resp.getNombreApoderado());
        verify(auditoriaService, times(1)).registrar(any(), eq("ALTA_ATOMICA"), eq("Alumno"), eq("20"), any());
    }

    @Test
    @DisplayName("Alta atómica rechaza si el RUT del alumno ya existe")
    void testAltaAtomicaRechazaRutAlumnoDuplicado() {
        when(usuarioRepository.existsByRut("24.111.222-3")).thenReturn(true);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> usuarioService.registrarAlumnoConApoderado(dtoAlta));

        assertTrue(ex.getMessage().contains("RUT del alumno ya está registrado"));
        verify(alumnoRepository, never()).save(any());
        verify(apoderadoAlumnoRepository, never()).save(any());
    }

    @Test
    @DisplayName("Desvinculación física de ApoderadoAlumno elimina relación y audita el evento")
    void testDesvinculacionFisica() {
        Alumno alumno = new Alumno();
        alumno.setId(20L);
        alumno.setEstado(EstadoCuenta.ACTIVA);

        Apoderado apoderado = new Apoderado();
        apoderado.setId(10L);

        ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumno, Parentesco.PADRE);

        when(alumnoRepository.findById(20L)).thenReturn(Optional.of(alumno));
        when(apoderadoRepository.findById(10L)).thenReturn(Optional.of(apoderado));
        when(apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(10L, 20L)).thenReturn(Optional.of(rel));
        when(apoderadoAlumnoRepository.countByIdAlumnoId(20L)).thenReturn(2L); // Alumno tiene otro apoderado

        usuarioService.desvincularApoderado(20L, 10L, "Cambio de tutor legal informado por juzgado", 1L);

        verify(apoderadoAlumnoRepository, times(1)).delete(rel);
        verify(auditoriaService, times(1)).registrar(eq(1L), eq("DESVINCULACION_APODERADO"), eq("ApoderadoAlumno"), eq("10-20"), contains("Cambio de tutor legal"));
    }

    @Test
    @DisplayName("Desvinculación rechaza si es el único apoderado de un alumno activo")
    void testDesvinculacionRechazaUnicoApoderado() {
        Alumno alumno = new Alumno();
        alumno.setId(20L);
        alumno.setEstado(EstadoCuenta.ACTIVA);

        Apoderado apoderado = new Apoderado();
        apoderado.setId(10L);

        ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumno, Parentesco.PADRE);

        when(alumnoRepository.findById(20L)).thenReturn(Optional.of(alumno));
        when(apoderadoRepository.findById(10L)).thenReturn(Optional.of(apoderado));
        when(apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(10L, 20L)).thenReturn(Optional.of(rel));
        when(apoderadoAlumnoRepository.countByIdAlumnoId(20L)).thenReturn(1L); // Solo tiene 1 apoderado

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> usuarioService.desvincularApoderado(20L, 10L, "Intento sin otro apoderado", 1L));

        assertTrue(ex.getMessage().contains("único apoderado"));
        verify(apoderadoAlumnoRepository, never()).delete(any());
    }
}
