package cl.edusaldo.productos;

import cl.edusaldo.productos.controller.CategoriaController;
import cl.edusaldo.productos.dto.CategoriaDTO;
import cl.edusaldo.productos.model.Categoria;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CategoriaController.class)
class CategoriaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductoService productoService;

    @Test
    @DisplayName("HTTP GET /api/categorias - Listar categorías")
    void testListarCategoriasHttp() throws Exception {
        Categoria c = new Categoria("Arte", "Pinceles y témperas");
        c.setId(4L);

        when(productoService.listarCategorias()).thenReturn(List.of(c));

        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(4))
                .andExpect(jsonPath("$[0].nombre").value("Arte"));
    }

    @Test
    @DisplayName("HTTP POST /api/categorias - Crear categoría")
    void testCrearCategoriaHttp() throws Exception {
        Categoria c = new Categoria("Música", "Instrumentos y cuadernos pentagramados");
        c.setId(6L);

        when(productoService.crearCategoria(any(CategoriaDTO.class))).thenReturn(c);

        CategoriaDTO dto = new CategoriaDTO("Música", "Instrumentos y cuadernos pentagramados");

        mockMvc.perform(post("/api/categorias")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(6))
                .andExpect(jsonPath("$.nombre").value("Música"));
    }
}
