package cl.edusaldo.ventas;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.edusaldo.ventas.controller.*;
import cl.edusaldo.ventas.dto.*;
import cl.edusaldo.ventas.exception.*;
import cl.edusaldo.ventas.model.*;
import cl.edusaldo.ventas.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReservaEntregaControllerTest {
  @Test
  void entregaPendienteRespondeContratoRecuperableSinConfirmar() throws Exception {
    EntregaService service = mock(EntregaService.class);
    when(service.registrarEntregaMeson(any()))
        .thenThrow(new OperacionPendienteException(42L, new IllegalStateException("timeout")));
    var mvc =
        MockMvcBuilders.standaloneSetup(new EntregaController(service))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    mvc.perform(
            post("/api/entregas/meson")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"alumnoId\":4,\"encargadoId\":2,\"items\":[{\"productoId\":1,\"cantidad\":1}]}"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.codigo").value("OPERACION_PENDIENTE_RECUPERACION"))
        .andExpect(jsonPath("$.operacionId").value(42))
        .andExpect(jsonPath("$.estadoOperacion").value("PENDIENTE_RECUPERACION"))
        .andExpect(jsonPath("$.recuperable").value(true));
  }

  @Test
  void contratoReservaIncluyeEstadoOperacionYDetalleCalculado() throws Exception {
    ReservaService service = mock(ReservaService.class);
    Reserva r = new Reserva("R", 4L, 3L, 2000);
    r.setId(10L);
    r.agregarDetalle(1L, "Cuaderno", 2, 1000);
    when(service.crearReserva(any())).thenReturn(r);
    var mvc =
        MockMvcBuilders.standaloneSetup(new ReservaController(service))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    mvc.perform(
            post("/api/reservas")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"alumnoId\":4,\"creadaPorId\":3,\"items\":[{\"productoId\":1,\"cantidad\":2}]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.total").value(2000))
        .andExpect(jsonPath("$.items[0].subtotal").value(2000))
        .andExpect(jsonPath("$.estadoOperacion").value("COMPLETADA"));
  }

  @Test
  void entradaNumericaInvalidaNoInvocaElServicio() throws Exception {
    EntregaService service = mock(EntregaService.class);
    var mvc =
        MockMvcBuilders.standaloneSetup(new EntregaController(service))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
    mvc.perform(
            post("/api/entregas/meson")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    "{\"alumnoId\":4,\"encargadoId\":2,\"items\":[{\"productoId\":1,\"cantidad\":0}]}"))
        .andExpect(status().isBadRequest());
    verifyNoInteractions(service);
  }
}
