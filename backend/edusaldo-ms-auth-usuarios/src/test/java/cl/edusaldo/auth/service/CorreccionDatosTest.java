package cl.edusaldo.auth.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import cl.edusaldo.auth.dto.SolicitudCorreccionDTO;
import cl.edusaldo.auth.model.*;
import cl.edusaldo.auth.repository.*;
import java.util.Optional;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

class CorreccionDatosTest {
  UsuarioRepository usuarios; SolicitudCorreccionDatosRepository solicitudes; UsuarioService servicio; Apoderado apoderado;
  @BeforeEach void preparar() {
    usuarios = mock(UsuarioRepository.class); solicitudes = mock(SolicitudCorreccionDatosRepository.class);
    servicio = new UsuarioService(usuarios, mock(AlumnoRepository.class), mock(ApoderadoRepository.class), mock(ApoderadoAlumnoRepository.class), mock(PoliticaAccesoService.class), mock(AuditoriaService.class), mock(TokenRecuperacionRepository.class));
    ReflectionTestUtils.setField(servicio, "solicitudCorreccionRepository", solicitudes);
    apoderado = new Apoderado("12345678-9", "Ana", "Pérez", "ana@example.org", "clave", "1234"); apoderado.setId(3L);
    var request = new MockHttpServletRequest(); request.addHeader("X-Establecimiento-Id", "1"); request.addHeader("X-Usuario-Id", "3"); request.addHeader("X-Rol", "APODERADO");
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
  }
  @AfterEach void limpiar() { RequestContextHolder.resetRequestAttributes(); }
  @Test void rechazaCampoInexistenteSinGuardar() {
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    when(solicitudes.save(any())).thenAnswer(inv -> inv.getArgument(0));
    var dto = new SolicitudCorreccionDTO(); dto.setUsuarioId(3L); dto.setCampoSolicitado("inventado"); dto.setValorPropuesto("x"); dto.setMotivo("corregir");
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarSolicitudCorreccion(dto));
    verify(solicitudes, never()).save(any());
  }
  @Test void solicitudYaResueltaNoPuedeVolverAAprobarse() {
    ((MockHttpServletRequest) ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest()).removeHeader("X-Rol");
    ((MockHttpServletRequest) ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest()).addHeader("X-Rol", "ADMINISTRADOR");
    var solicitud = new SolicitudCorreccionDatos(1L, 3L, "primerNombre", "Ana", "Otra", "error"); solicitud.resolver(false, 1L, "rechazada");
    when(solicitudes.findByIdAndIdEstablecimiento(7L, 1L)).thenReturn(Optional.of(solicitud));
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    assertThrows(IllegalStateException.class, () -> servicio.resolverSolicitudCorreccion(7L, true, 1L, "otra vez"));
    verify(usuarios, never()).save(any());
  }
  @Test void aprobacionValidaCambiaElDatoYConservaLaDecision() {
    var req = (MockHttpServletRequest) ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
    req.removeHeader("X-Rol"); req.addHeader("X-Rol", "ADMINISTRADOR");
    var solicitud = new SolicitudCorreccionDatos(1L, 3L, "primerNombre", "Ana", "María", "error");
    when(solicitudes.findByIdAndIdEstablecimiento(7L, 1L)).thenReturn(Optional.of(solicitud));
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    when(solicitudes.save(any())).thenAnswer(inv -> inv.getArgument(0));
    var resultado = servicio.resolverSolicitudCorreccion(7L, true, null, "verificado");
    assertEquals("María", apoderado.getPrimerNombre());
    assertEquals("APROBADA", resultado.getEstado());
    verify(usuarios).save(apoderado);
  }
  @Test void usuarioNoAdministradorNoPuedeResolver() {
    assertThrows(org.springframework.web.server.ResponseStatusException.class,
        () -> servicio.resolverSolicitudCorreccion(7L, true, null, "intento"));
    verifyNoInteractions(solicitudes);
  }
  @Test void rechazaCorreoInvalido() {
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    var dto = new SolicitudCorreccionDTO(); dto.setUsuarioId(3L); dto.setCampoSolicitado("correo"); dto.setValorPropuesto("correo inválido"); dto.setMotivo("error");
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarSolicitudCorreccion(dto));
    verify(solicitudes, never()).save(any());
  }

  @Test void rechazaCursoParaApoderado() {
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    var dto = new SolicitudCorreccionDTO(); dto.setUsuarioId(3L); dto.setCampoSolicitado("curso"); dto.setValorPropuesto("8 básico"); dto.setMotivo("error");
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarSolicitudCorreccion(dto));
    verify(solicitudes, never()).save(any());
  }
  @Test void rechazaCorreoYaAsignado() {
    when(usuarios.findById(3L)).thenReturn(Optional.of(apoderado));
    var otra = new Encargado("87654321-0", "Luis", "Rojas", "ocupado@example.org", "clave"); otra.setId(4L);
    when(usuarios.findByCorreo("ocupado@example.org")).thenReturn(Optional.of(otra));
    var dto = new SolicitudCorreccionDTO(); dto.setUsuarioId(3L); dto.setCampoSolicitado("correo"); dto.setValorPropuesto("ocupado@example.org"); dto.setMotivo("error");
    assertThrows(IllegalArgumentException.class, () -> servicio.registrarSolicitudCorreccion(dto));
    verify(solicitudes, never()).save(any());
  }

}
