package cl.edusaldo.productos;

import cl.edusaldo.productos.controller.InventarioController;
import cl.edusaldo.productos.dto.*;
import cl.edusaldo.productos.model.*;
import cl.edusaldo.productos.service.InventarioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(InventarioController.class)
class InventarioControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private InventarioService inventarioService;

    @Test
    @DisplayName("HTTP POST /api/inventario/ingresos-manuales - Encargado registra mercadería")
    void testRegistrarIngresoManualHttp() throws Exception {
        IngresoStock ingreso = new IngresoStock(2L, "Proveedor Test", "DOC-01", "Obs");
        ingreso.setId(10L);

        when(inventarioService.registrarIngresoManual(any(IngresoManualDTO.class))).thenReturn(ingreso);

        IngresoManualDTO dto = new IngresoManualDTO();
        dto.setEncargadoId(2L);
        dto.setProveedor("Proveedor Test");
        dto.setDetalles(List.of(new DetalleIngresoDTO(1L, 20)));

        mockMvc.perform(post("/api/inventario/ingresos-manuales")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.encargadoId").value(2));
    }

    @Test
    @DisplayName("HTTP POST /api/inventario/ajustes/solicitar - Encargado solicita ajuste")
    void testSolicitarAjusteHttp() throws Exception {
        Producto p = new Producto();
        p.setId(1L);
        p.setNombre("Cuaderno");

        SolicitudAjusteStock sol = new SolicitudAjusteStock(p, -2, "Merma", 2L);
        sol.setId(20L);

        when(inventarioService.solicitarAjuste(any(SolicitarAjusteDTO.class))).thenReturn(sol);

        SolicitarAjusteDTO dto = new SolicitarAjusteDTO(1L, -2, "Merma", 2L);

        mockMvc.perform(post("/api/inventario/ajustes/solicitar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(20))
                .andExpect(jsonPath("$.estado").value("PENDIENTE"))
                .andExpect(jsonPath("$.cantidad").value(-2));
    }

    @Test
    @DisplayName("HTTP POST /api/inventario/ajustes/{id}/aprobar - Admin aprueba ajuste")
    void testAprobarAjusteHttp() throws Exception {
        Producto p = new Producto();
        p.setId(1L);
        p.setNombre("Cuaderno");

        SolicitudAjusteStock sol = new SolicitudAjusteStock(p, -2, "Merma", 2L);
        sol.setId(21L);
        sol.aprobar(1L);

        when(inventarioService.aprobarAjuste(eq(21L), any(AprobarAjusteDTO.class))).thenReturn(sol);

        AprobarAjusteDTO dto = new AprobarAjusteDTO(1L);

        mockMvc.perform(post("/api/inventario/ajustes/21/aprobar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(21))
                .andExpect(jsonPath("$.estado").value("APROBADA"))
                .andExpect(jsonPath("$.administradorId").value(1));
    }

    @Test
    @DisplayName("HTTP POST /api/inventario/retener - Retiene stock por reserva")
    void testRetenerHttp() throws Exception {
        RetenerStockDTO dto = new RetenerStockDTO(1L, 2, 50L, 3L);

        mockMvc.perform(post("/api/inventario/retener")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Stock retenido exitosamente"));
    }

    @Test
    @DisplayName("HTTP GET /api/inventario/movimientos - Lista libro mayor")
    void testListarMovimientosHttp() throws Exception {
        Producto p = new Producto();
        p.setId(1L);
        p.setNombre("Cuaderno");

        MovimientoInventario mov = new MovimientoInventario(p, TipoMovimientoInventario.INGRESO, 10, 10, null, 1L, 2L);
        mov.setId(100L);

        when(inventarioService.listarMovimientos(null, null)).thenReturn(List.of(mov));

        mockMvc.perform(get("/api/inventario/movimientos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100))
                .andExpect(jsonPath("$[0].tipo").value("INGRESO"));
    }
}
