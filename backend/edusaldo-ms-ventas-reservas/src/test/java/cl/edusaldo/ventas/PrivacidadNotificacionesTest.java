package cl.edusaldo.ventas;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.edusaldo.ventas.client.UsuariosClient;
import cl.edusaldo.ventas.config.ContextoSolicitud;
import cl.edusaldo.ventas.controller.ReservaController;
import cl.edusaldo.ventas.model.NotificacionPendiente;
import cl.edusaldo.ventas.repository.NotificacionPendienteRepository;
import cl.edusaldo.ventas.service.ReservaService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PrivacidadNotificacionesTest {
  @Test
  void alumnoSoloPuedeConsultarSuPropioId() {
    var request = new org.springframework.mock.web.MockHttpServletRequest();
    request.addHeader("X-Usuario-Id", "10");
    request.addHeader("X-Rol", "ALUMNO");
    org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
        new org.springframework.web.context.request.ServletRequestAttributes(request));
    try {
      var cliente = new UsuariosClient();
      assertTrue(cliente.puedeConsultarAlumno(10L));
      assertFalse(cliente.puedeConsultarAlumno(11L));
    } finally {
      org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    }
  }

  @Test
  void listadoProtegeCorreosYFiltraAlumnosYEstablecimiento() throws Exception {
    var repo = mock(NotificacionPendienteRepository.class);
    var usuarios = mock(UsuariosClient.class);
    var propia =
        new NotificacionPendiente(
            null, null, 10L, "LISTA", "uno@example.cl", "Aviso", "Reserva lista");
    var otroCorreo =
        new NotificacionPendiente(
            null, null, 10L, "LISTA", "dos@example.cl", "Aviso", "Reserva lista");
    var otroAlumno =
        new NotificacionPendiente(
            null, null, 11L, "LISTA", "ajeno@example.cl", "Aviso", "Reserva lista");
    when(repo.findByIdEstablecimientoOrderByFechaCreacionDesc(7L))
        .thenReturn(List.of(propia, otroCorreo, otroAlumno));
    when(repo.findByIdEstablecimientoOrderByFechaCreacionDesc(8L)).thenReturn(List.of());
    when(usuarios.puedeConsultarAlumno(anyLong()))
        .thenAnswer(
            i -> {
              Long alumno = i.getArgument(0);
              return "ALUMNO".equals(ContextoSolicitud.rol())
                  ? alumno.equals(ContextoSolicitud.usuario(null))
                  : ContextoSolicitud.usuario(null).equals(20L) && alumno.equals(10L);
            });
    var servicio = new ReservaService(null, null, repo, null, usuarios, null);
    var mvc = MockMvcBuilders.standaloneSetup(new ReservaController(servicio)).build();
    mvc.perform(
            get("/api/reservas/notificaciones")
                .header("X-Establecimiento-Id", "7")
                .header("X-Usuario-Id", "20")
                .header("X-Rol", "APODERADO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].destinatarioCorreo").doesNotExist())
        .andExpect(jsonPath("$[1].destinatarioCorreo").doesNotExist());
    verify(usuarios, times(1)).puedeConsultarAlumno(10L);
    mvc.perform(
            get("/api/reservas/notificaciones")
                .header("X-Establecimiento-Id", "7")
                .header("X-Usuario-Id", "21")
                .header("X-Rol", "APODERADO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
    mvc.perform(
            get("/api/reservas/notificaciones")
                .header("X-Establecimiento-Id", "7")
                .header("X-Usuario-Id", "10")
                .header("X-Rol", "ALUMNO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].destinatarioCorreo").doesNotExist())
        .andExpect(jsonPath("$[1].destinatarioCorreo").doesNotExist());
    mvc.perform(
            get("/api/reservas/notificaciones")
                .header("X-Establecimiento-Id", "7")
                .header("X-Usuario-Id", "2")
                .header("X-Rol", "ENCARGADO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(3))
        .andExpect(jsonPath("$[0].destinatarioCorreo").value("uno@example.cl"));
    mvc.perform(
            get("/api/reservas/notificaciones")
                .header("X-Establecimiento-Id", "8")
                .header("X-Usuario-Id", "2")
                .header("X-Rol", "ENCARGADO"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));
  }
}
