package cl.edusaldo.productos.service;

import cl.edusaldo.productos.dto.ActualizarProductoDTO;
import cl.edusaldo.productos.dto.CategoriaDTO;
import cl.edusaldo.productos.dto.CrearProductoDTO;
import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.model.EstadoRegistro;
import cl.edusaldo.productos.model.Producto;
import cl.edusaldo.productos.repository.CategoriaRepository;
import cl.edusaldo.productos.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional
    public Producto crearProducto(CrearProductoDTO dto) {
        if (productoRepository.existsBySku(dto.getSku())) {
            throw new IllegalArgumentException("Ya existe un producto con el SKU: " + dto.getSku());
        }

        Categoria categoria = categoriaRepository.findById(dto.getCategoriaId())
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + dto.getCategoriaId()));

        Producto p = new Producto(
                categoria,
                dto.getSku(),
                dto.getNombre(),
                dto.getDescripcion(),
                dto.getImagenUrl(),
                dto.getCursoNivel(),
                dto.getPrecio(),
                dto.getStockInicial(),
                dto.getStockCritico()
        );

        return productoRepository.save(p);
    }

    @Transactional(readOnly = true)
    public Producto obtenerPorId(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<Producto> listarTodos(Long categoriaId, Boolean soloActivos) {
        if (categoriaId != null) {
            return productoRepository.findByCategoriaId(categoriaId);
        }
        if (Boolean.TRUE.equals(soloActivos)) {
            return productoRepository.findByEstado(EstadoRegistro.ACTIVO);
        }
        return productoRepository.findAll();
    }

    @Transactional
    public Producto actualizarProducto(Long id, ActualizarProductoDTO dto) {
        Producto p = obtenerPorId(id);

        Categoria cat = null;
        if (dto.getCategoriaId() != null) {
            cat = categoriaRepository.findById(dto.getCategoriaId())
                    .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + dto.getCategoriaId()));
        }

        p.editar(
                dto.getNombre(),
                dto.getDescripcion() != null ? dto.getDescripcion() : p.getDescripcion(),
                dto.getImagenUrl() != null ? dto.getImagenUrl() : p.getImagenUrl(),
                dto.getCursoNivel() != null ? dto.getCursoNivel() : p.getCursoNivel(),
                dto.getPrecio() != null ? dto.getPrecio() : p.getPrecio(),
                dto.getStockCritico() != null ? dto.getStockCritico() : p.getStockCritico(),
                cat
        );

        return productoRepository.save(p);
    }

    @Transactional
    public void inactivarProducto(Long id) {
        Producto p = obtenerPorId(id);
        p.inactivar();
        productoRepository.save(p);
    }

    @Transactional(readOnly = true)
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    @Transactional
    public Categoria crearCategoria(CategoriaDTO dto) {
        if (categoriaRepository.existsByNombre(dto.getNombre())) {
            throw new IllegalArgumentException("Ya existe una categoría con el nombre: " + dto.getNombre());
        }
        Categoria c = new Categoria(dto.getNombre(), dto.getDescripcion());
        return categoriaRepository.save(c);
    }

    @Transactional
    public Categoria actualizarCategoria(Long id, CategoriaDTO dto) {
        Categoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + id));
        c.editar(dto.getNombre(), dto.getDescripcion());
        return categoriaRepository.save(c);
    }

    @Transactional
    public void inactivarCategoria(Long id) {
        Categoria c = categoriaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada con ID: " + id));
        c.inactivar();
        categoriaRepository.save(c);
    }
}
