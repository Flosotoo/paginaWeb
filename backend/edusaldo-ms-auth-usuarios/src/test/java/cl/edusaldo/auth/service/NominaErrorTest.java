package cl.edusaldo.auth.service;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import cl.edusaldo.auth.dto.*;
import cl.edusaldo.auth.repository.*;
import java.util.List;
import org.junit.jupiter.api.Test;
class NominaErrorTest {
  @Test void identificaLaFilaQueFalla() {
    var req = new org.springframework.mock.web.MockHttpServletRequest(); req.addHeader("X-Usuario-Id", "1");
    org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(new org.springframework.web.context.request.ServletRequestAttributes(req));
    var servicio = spy(new UsuarioService(mock(UsuarioRepository.class), mock(AlumnoRepository.class), mock(ApoderadoRepository.class), mock(ApoderadoAlumnoRepository.class), mock(PoliticaAccesoService.class), mock(AuditoriaService.class), mock(TokenRecuperacionRepository.class)));
    var primero = new AltaAlumnoApoderadoDTO(); primero.setRutAlumno("11111111-1"); primero.setRutApoderado("22222222-2");
    var segundo = new AltaAlumnoApoderadoDTO(); segundo.setRutAlumno("33333333-3"); segundo.setRutApoderado("22222222-2");
    doReturn(new AltaAlumnoApoderadoResponseDTO()).when(servicio).registrarAlumnoConApoderado(primero);
    doThrow(new IllegalArgumentException("RUT ya registrado")).when(servicio).registrarAlumnoConApoderado(segundo);
    var error = assertThrows(IllegalArgumentException.class, () -> servicio.importarNominaMasiva(List.of(primero, segundo)));
    org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    assertTrue(error.getMessage().contains("Fila 2")); assertTrue(error.getMessage().contains("RUT ya registrado"));
  }
}
