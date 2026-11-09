package cl.edusaldo.auth;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import cl.edusaldo.auth.dto.AltaAlumnoApoderadoDTO;
import cl.edusaldo.auth.dto.AltaAlumnoApoderadoResponseDTO;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import cl.edusaldo.auth.service.AuditoriaService;
import cl.edusaldo.auth.service.UsuarioService;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("Pruebas de Alta Atómica  Desvinculación  con Auditoría")
class AltaAtomicaTest {

  @Mock private UsuarioRepository usuarioRepository;
  @Mock private AlumnoRepository alumnoRepository;
  @Mock private ApoderadoRepository apoderadoRepository;
  @Mock private ApoderadoAlumnoRepository apoderadoAlumnoRepository;
  @Mock private AuditoriaService auditoriaService;

  @InjectMocks private UsuarioService usuarioService;

  private AltaAlumnoApoderadoDTO dtoAlta;

  @BeforeEach
  void setUp() {
    dtoAlta = new AltaAlumnoApoderadoDTO();
    dtoAlta.setRutAlumno("24111222-5");
    dtoAlta.setPrimerNombreAlumno("Tomás");
    dtoAlta.setPrimerApellidoAlumno("González");
    dtoAlta.setFechaNacimiento(LocalDate.of(2012, 5, 15));
    dtoAlta.setCurso("7° Básico");
    dtoAlta.setRutApoderado("16333444-5");
    dtoAlta.setPrimerNombreApoderado("Carlos");
    dtoAlta.setPrimerApellidoApoderado("González");
    dtoAlta.setCorreoApoderado("carlos.gonzalez@gmail.com");
    dtoAlta.setTelefonoApoderado("+56912345678");
    dtoAlta.setParentesco(Parentesco.PADRE);
  }

  @Test
  @DisplayName("Alta atómica exitosa crea Alumno, Apoderado y relación ApoderadoAlumno")
  void testAltaAtomicaExitosa() {
    when(usuarioRepository.existsByRut("24111222-5")).thenReturn(false);
    when(apoderadoRepository.findByRut("16333444-5")).thenReturn(Optional.empty());

    Apoderado apoderadoGuardado =
        new Apoderado(
            "16333444-5",
            "Carlos",
            "González",
            "carlos.gonzalez@gmail.com",
            "hashTemp",
            "+56912345678");
    apoderadoGuardado.setId(10L);
    when(apoderadoRepository.save(any(Apoderado.class))).thenReturn(apoderadoGuardado);

    Alumno alumnoGuardado =
        new Alumno(
            "24111222-5",
            "Tomás",
            "González",
            "tomas.gonzalez@alumnos.colegio.cl",
            "hashTemp",
            LocalDate.of(2012, 5, 15),
            "7° Básico");
    alumnoGuardado.setId(20L);
    when(alumnoRepository.save(any(Alumno.class))).thenReturn(alumnoGuardado);

    when(apoderadoAlumnoRepository.save(any(ApoderadoAlumno.class)))
        .thenAnswer(i -> i.getArgument(0));

    AltaAlumnoApoderadoResponseDTO resp = usuarioService.registrarAlumnoConApoderado(dtoAlta);

    assertNotNull(resp);
    assertEquals(20L, resp.getAlumnoId());
    assertEquals(10L, resp.getApoderadoId());
    assertEquals("Tomás González", resp.getNombreAlumno());
    assertEquals("Carlos González", resp.getNombreApoderado());
    verify(auditoriaService, times(1))
        .registrar(any(), eq("ALTA_ATOMICA"), eq("Alumno"), eq("20"), any());
  }

  @Test
  @DisplayName("Alta atómica rechaza si el RUT del alumno ya existe")
  void testAltaAtomicaRechazaRutAlumnoDuplicado() {
    when(usuarioRepository.existsByRut("24111222-5")).thenReturn(true);

    IllegalArgumentException ex =
        assertThrows(
            IllegalArgumentException.class,
            () -> usuarioService.registrarAlumnoConApoderado(dtoAlta));

    assertTrue(ex.getMessage().contains("RUT del alumno ya está registrado"));
    verify(alumnoRepository, never()).save(any());
    verify(apoderadoAlumnoRepository, never()).save(any());
  }

  @Test
  @DisplayName("Desvinculación conserva relación y audita el evento")
  void testDesvinculacionConHistorial() {
    var request = new org.springframework.mock.web.MockHttpServletRequest();
    request.addHeader("X-Usuario-Id", "1");
    org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
        new org.springframework.web.context.request.ServletRequestAttributes(request));
    Alumno alumno = new Alumno();
    alumno.setId(20L);
    alumno.setEstado(EstadoCuenta.ACTIVA);

    Apoderado apoderado = new Apoderado();
    apoderado.setId(10L);

    ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, alumno, Parentesco.PADRE);

    when(alumnoRepository.bloquear(20L, 1L)).thenReturn(Optional.of(alumno));
    when(apoderadoRepository.findById(10L)).thenReturn(Optional.of(apoderado));
    when(apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(10L, 20L))
        .thenReturn(Optional.of(rel));
    when(apoderadoAlumnoRepository.bloquearApoderadosHabilitados(20L, 1L))
        .thenReturn(java.util.List.of(10L, 11L));

    usuarioService.desvincularApoderado(
        20L, 10L, "Cambio de tutor legal informado por juzgado", 1L);

    org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    assertFalse(rel.isActivo());
    assertEquals("Cambio de tutor legal informado por juzgado", rel.getMotivoDesvinculacion());
    verify(apoderadoAlumnoRepository, times(1)).save(rel);
    verify(apoderadoAlumnoRepository, never()).delete(any());
    verify(auditoriaService, times(1))
        .registrar(
            eq(1L),
            eq("DESVINCULACION_APODERADO"),
            eq("ApoderadoAlumno"),
            eq("10-20"),
            contains("Cambio de tutor legal"));
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

    when(alumnoRepository.bloquear(20L, 1L)).thenReturn(Optional.of(alumno));
    when(apoderadoRepository.findById(10L)).thenReturn(Optional.of(apoderado));
    when(apoderadoAlumnoRepository.findByIdApoderadoIdAndIdAlumnoId(10L, 20L))
        .thenReturn(Optional.of(rel));
    when(apoderadoAlumnoRepository.bloquearApoderadosHabilitados(20L, 1L))
        .thenReturn(java.util.List.of(10L));

    IllegalStateException ex =
        assertThrows(
            IllegalStateException.class,
            () -> usuarioService.desvincularApoderado(20L, 10L, "Intento sin otro apoderado", 1L));

    assertTrue(ex.getMessage().contains("único apoderado"));
    verify(apoderadoAlumnoRepository, never()).delete(any());
  }
}
