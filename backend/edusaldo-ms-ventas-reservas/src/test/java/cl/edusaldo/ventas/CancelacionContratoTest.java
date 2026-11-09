package cl.edusaldo.ventas;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import cl.edusaldo.ventas.controller.ReservaController;
import cl.edusaldo.ventas.service.ReservaService;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CancelacionContratoTest {
  @Test
  void requiereMotivoSinInvocarElServicio() throws Exception {
    var servicio = mock(ReservaService.class);
    var mvc = MockMvcBuilders.standaloneSetup(new ReservaController(servicio)).build();
    for (String cuerpo : new String[] {"{}", "{\"motivo\":\"   \"}", "{\"motivo\":\"" + "x".repeat(256) + "\"}"})
      mvc.perform(post("/api/reservas/5/cancelar").header("X-Usuario-Id", "3")
              .header("X-Establecimiento-Id", "1").header("X-Rol", "APODERADO")
              .contentType(MediaType.APPLICATION_JSON).content(cuerpo))
          .andExpect(status().isBadRequest());
    verifyNoInteractions(servicio);
  }
}
