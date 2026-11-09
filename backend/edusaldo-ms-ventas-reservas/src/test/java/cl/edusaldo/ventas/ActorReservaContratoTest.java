package cl.edusaldo.ventas;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import cl.edusaldo.ventas.controller.ReservaController;
import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.Reserva;
import cl.edusaldo.ventas.service.ReservaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ActorReservaContratoTest {
  @Test
  void preparacionYEntregaUsanLaIdentidadDeSesion() throws Exception {
    var servicio = mock(ReservaService.class);
    when(servicio.marcarListaParaRetiro(eq(5L), anyLong())).thenReturn(new Reserva("RES-5", 4L, 2L, 100));
    when(servicio.entregarReserva(eq(5L), anyLong())).thenReturn(new Entrega());
    var mvc = MockMvcBuilders.standaloneSetup(new ReservaController(servicio)).build();
    for (String accion : new String[] {"marcar-lista", "entregar"})
      mvc.perform(post("/api/reservas/5/" + accion).header("X-Usuario-Id", "2")
          .header("X-Establecimiento-Id", "1").header("X-Rol", "ENCARGADO")
          .contentType(MediaType.APPLICATION_JSON).content("{\"encargadoId\":999}"))
          .andExpect(accion.equals("entregar") ? status().isCreated() : status().isOk());
    verify(servicio).marcarListaParaRetiro(5L, 2L);
    verify(servicio).entregarReserva(5L, 2L);
  }
}
