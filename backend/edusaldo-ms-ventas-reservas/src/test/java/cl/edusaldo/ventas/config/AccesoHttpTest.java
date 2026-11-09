package cl.edusaldo.ventas.config;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import cl.edusaldo.ventas.controller.SaludController;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AccesoHttpTest {
  @Test
  void preflightRunsBeforeInternalKeyAndRealRequestsStillRequireIt() throws Exception {
    var cors = new CorsConfig().cors("http://localhost:5173,http://localhost:4173");
    assertTrue(cors.getOrder() < 0);
    DataSource db = mock(DataSource.class);
    var mvc =
        MockMvcBuilders.standaloneSetup(new SaludController(db))
            .addFilters(cors.getFilter(), new InternalAccessFilter())
            .build();
    mvc.perform(
            options("/api/entregas/meson")
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,Content-Type"))
        .andExpect(status().isOk())
        .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
        .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    mvc.perform(get("/internal/salud")).andExpect(status().isUnauthorized());
    verifyNoInteractions(db);
  }

  @Test
  void unknownOriginIsRejectedBeforeBusinessRequest() throws Exception {
    var cors = new CorsConfig().cors("http://localhost:5173,http://localhost:4173");
    DataSource db = mock(DataSource.class);
    var mvc =
        MockMvcBuilders.standaloneSetup(new SaludController(db))
            .addFilters(cors.getFilter(), new InternalAccessFilter())
            .build();
    mvc.perform(
            options("/api/reservas")
                .header("Origin", "https://ajeno.example")
                .header("Access-Control-Request-Method", "POST"))
        .andExpect(status().isForbidden());
    verifyNoInteractions(db);
  }
}
