package cl.edusaldo.auth;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import cl.edusaldo.auth.controller.ConfiguracionController;
import cl.edusaldo.auth.service.ConfiguracionService;
import cl.edusaldo.auth.service.AuditoriaService;
import cl.edusaldo.auth.dto.ConfiguracionDTO;
import cl.edusaldo.auth.repository.ConfiguracionInstitucionalRepository;
import cl.edusaldo.auth.repository.PoliticaAccesoRepository;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ConfiguracionContratoTest {
  @Test
  void encargadoNoPuedeActualizarAunqueInvoqueElServicio() {
    var repo = mock(ConfiguracionInstitucionalRepository.class);
    var servicio = new ConfiguracionService(repo, mock(PoliticaAccesoRepository.class), mock(AuditoriaService.class));
    var request = new org.springframework.mock.web.MockHttpServletRequest();
    request.addHeader("X-Rol", "ENCARGADO");
    org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
        new org.springframework.web.context.request.ServletRequestAttributes(request));
    try {
      assertThrows(org.springframework.web.server.ResponseStatusException.class,
          () -> servicio.actualizarConfiguracion(new ConfiguracionDTO("Colegio", "Librería", "mail@colegio.cl", null), 1L));
      verifyNoInteractions(repo);
    } finally {
      org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    }
  }

  @Test
  void configuracionIncompletaOCorreoInvalidoNoLlegaAlServicio() throws Exception {
    var servicio = mock(ConfiguracionService.class);
    var mvc = MockMvcBuilders.standaloneSetup(new ConfiguracionController(servicio)).build();
    for (String cuerpo : new String[] {"{}", "{\"nombreEstablecimiento\":\"Colegio\",\"nombreLibreria\":\"Librería\",\"correoContacto\":\"incorrecto\"}"})
      mvc.perform(put("/api/configuracion").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
          .andExpect(status().isBadRequest());
    verifyNoInteractions(servicio);
  }
}
