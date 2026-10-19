package cl.edusaldo.productos;

import cl.edusaldo.productos.controller.ProductoController;
import cl.edusaldo.productos.dto.ActualizarProductoDTO;
import cl.edusaldo.productos.dto.CrearProductoDTO;
import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.model.Producto;
import cl.edusaldo.productos.service.ProductoService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductoController.class)
class ProductoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductoService productoService;

    @Test
    @DisplayName("HTTP GET /api/productos - Listar catálogo")
    void testListarProductosHttp() throws Exception {
        Categoria c = new Categoria("Papelería", "Útiles");
        c.setId(1L);

        Producto p = new Producto(c, "SKU-01", "Lápiz HB", "Lápiz", "http://img", "Todos", 450, 30, 5);
        p.setId(1L);

        when(productoService.listarTodos(null, null)).thenReturn(List.of(p));

        mockMvc.perform(get("/api/productos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].sku").value("SKU-01"))
                .andExpect(jsonPath("$[0].precio").value(450));
    }

    @Test
    @DisplayName("HTTP POST /api/productos - Crear nuevo producto")
    void testCrearProductoHttp() throws Exception {
        Categoria c = new Categoria("Papelería", "Útiles");
        c.setId(1L);

        Producto p = new Producto(c, "SKU-NEW", "Goma", "Goma", "http://img", "Todos", 350, 20, 5);
        p.setId(2L);

        when(productoService.crearProducto(any(CrearProductoDTO.class))).thenReturn(p);

        CrearProductoDTO dto = new CrearProductoDTO();
        dto.setCategoriaId(1L);
        dto.setSku("SKU-NEW");
        dto.setNombre("Goma");
        dto.setCursoNivel("Todos");
        dto.setPrecio(350);
        dto.setStockInicial(20);
        dto.setStockCritico(5);

        mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.sku").value("SKU-NEW"));
    }

    @Test
    @DisplayName("HTTP GET /api/productos/{id} - Obtener por ID")
    void testObtenerPorIdHttp() throws Exception {
        Categoria c = new Categoria("Papelería", "Útiles");
        c.setId(1L);

        Producto p = new Producto(c, "SKU-01", "Lápiz HB", "Lápiz", "http://img", "Todos", 450, 30, 5);
        p.setId(1L);

        when(productoService.obtenerPorId(1L)).thenReturn(p);

        mockMvc.perform(get("/api/productos/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Lápiz HB"));
    }

    @Test
    @DisplayName("HTTP DELETE /api/productos/{id} - Inactivar producto")
    void testEliminarProductoHttp() throws Exception {
        mockMvc.perform(delete("/api/productos/1"))
                .andExpect(status().isNoContent());
    }
}
