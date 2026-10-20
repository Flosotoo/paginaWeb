package cl.edusaldo.productos.controller;

import cl.edusaldo.productos.dto.CategoriaDTO;
import cl.edusaldo.productos.dto.CategoriaResponseDTO;
import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.service.ProductoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categorias")
@Tag(name = "Categorías", description = "Gestión de categorías del catálogo escolar")
public class CategoriaController {

    private final ProductoService productoService;

    public CategoriaController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    @Operation(summary = "Listar todas las categorías")
    public ResponseEntity<List<CategoriaResponseDTO>> listarCategorias() {
        List<CategoriaResponseDTO> list = productoService.listarCategorias().stream()
                .map(CategoriaResponseDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Operation(summary = "Crear nueva categoría")
    public ResponseEntity<CategoriaResponseDTO> crearCategoria(@Valid @RequestBody CategoriaDTO dto) {
        Categoria c = productoService.crearCategoria(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CategoriaResponseDTO(c));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar categoría")
    public ResponseEntity<CategoriaResponseDTO> actualizarCategoria(
            @PathVariable Long id,
            @Valid @RequestBody CategoriaDTO dto) {
        Categoria c = productoService.actualizarCategoria(id, dto);
        return ResponseEntity.ok(new CategoriaResponseDTO(c));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Inactivar categoría")
    public ResponseEntity<Void> inactivarCategoria(@PathVariable Long id) {
        productoService.inactivarCategoria(id);
        return ResponseEntity.noContent().build();
    }
}
