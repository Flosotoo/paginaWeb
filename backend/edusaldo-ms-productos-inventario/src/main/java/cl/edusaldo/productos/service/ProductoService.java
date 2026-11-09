package cl.edusaldo.productos.service;

import cl.edusaldo.productos.config.RequestContext;
import cl.edusaldo.productos.dto.ActualizarProductoDTO;
import cl.edusaldo.productos.dto.CategoriaDTO;
import cl.edusaldo.productos.dto.CrearProductoDTO;
import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.model.EstadoRegistro;
import cl.edusaldo.productos.model.Producto;
import cl.edusaldo.productos.repository.CategoriaRepository;
import cl.edusaldo.productos.repository.ProductoRepository;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductoService {

  private final ProductoRepository productoRepository;
  private final CategoriaRepository categoriaRepository;

  public ProductoService(
      ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
    this.productoRepository = productoRepository;
    this.categoriaRepository = categoriaRepository;
  }

  @Transactional
  public Producto crearProducto(CrearProductoDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    if (productoRepository.existsBySkuAndIdEstablecimiento(dto.getSku(), RequestContext.tenant())) {
      throw new IllegalArgumentException("Ya existe un producto con el SKU: " + dto.getSku());
    }

    Categoria categoria =
        categoriaRepository
            .findByIdAndIdEstablecimiento(dto.getCategoriaId(), RequestContext.tenant())
            .orElseThrow(
                () ->
                    new IllegalArgumentException(
                        "Categoría no encontrada con ID: " + dto.getCategoriaId()));

    Producto p =
        new Producto(
            categoria,
            dto.getSku(),
            dto.getNombre(),
            dto.getDescripcion(),
            dto.getImagenUrl(),
            dto.getCursoNivel(),
            dto.getPrecio(),
            dto.getStockInicial(),
            dto.getStockCritico());

    return productoRepository.save(p);
  }

  @Transactional(readOnly = true)
  public Producto obtenerPorId(Long id) {
    return productoRepository
        .findByIdAndIdEstablecimiento(id, RequestContext.tenant())
        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));
  }

  @Transactional(readOnly = true)
  public List<Producto> listarTodos(Long categoriaId, Boolean soloActivos) {
    return productoRepository.findAllByIdEstablecimiento(RequestContext.tenant()).stream()
        .filter(p -> categoriaId == null || categoriaId.equals(p.getCategoriaId()))
        .filter(p -> !Boolean.TRUE.equals(soloActivos) || p.getEstado() == EstadoRegistro.ACTIVO)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<Producto> listarCriticos() {
    return productoRepository.findAllByIdEstablecimiento(RequestContext.tenant()).stream()
        .filter(p -> p.getEstado() == EstadoRegistro.ACTIVO && p.esCritico())
        .collect(Collectors.toList());
  }

  @Transactional
  public Producto actualizarProducto(Long id, ActualizarProductoDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    Producto p = obtenerPorId(id);

    Categoria cat = null;
    if (dto.getCategoriaId() != null) {
      cat =
          categoriaRepository
              .findByIdAndIdEstablecimiento(dto.getCategoriaId(), RequestContext.tenant())
              .orElseThrow(
                  () ->
                      new IllegalArgumentException(
                          "Categoría no encontrada con ID: " + dto.getCategoriaId()));
    }

    p.editar(
        dto.getNombre(),
        dto.getDescripcion() != null ? dto.getDescripcion() : p.getDescripcion(),
        dto.getImagenUrl() != null ? dto.getImagenUrl() : p.getImagenUrl(),
        dto.getCursoNivel() != null ? dto.getCursoNivel() : p.getCursoNivel(),
        dto.getPrecio() != null ? dto.getPrecio() : p.getPrecio(),
        dto.getStockCritico() != null ? dto.getStockCritico() : p.getStockCritico(),
        cat);

    return productoRepository.save(p);
  }

  @Transactional
  public void inactivarProducto(Long id) {
    RequestContext.requireRoles("ADMINISTRADOR");
    Producto p = obtenerPorId(id);
    p.inactivar();
    productoRepository.save(p);
  }

  @Transactional(readOnly = true)
  public List<Categoria> listarCategorias() {
    return categoriaRepository.findAllByIdEstablecimiento(RequestContext.tenant());
  }

  @Transactional
  public Categoria crearCategoria(CategoriaDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    if (categoriaRepository.existsByNombreAndIdEstablecimiento(
        dto.getNombre(), RequestContext.tenant())) {
      throw new IllegalArgumentException(
          "Ya existe una categoría con el nombre: " + dto.getNombre());
    }
    Categoria c = new Categoria(dto.getNombre(), dto.getDescripcion());
    c.setIdEstablecimiento(RequestContext.tenant());
    return categoriaRepository.save(c);
  }

  @Transactional
  public Categoria actualizarCategoria(Long id, CategoriaDTO dto) {
    RequestContext.requireRoles("ADMINISTRADOR");
    Categoria c =
        categoriaRepository
            .findByIdAndIdEstablecimiento(id, RequestContext.tenant())
            .orElseThrow(
                () -> new IllegalArgumentException("Categoría no encontrada con ID: " + id));
    c.editar(dto.getNombre(), dto.getDescripcion());
    return categoriaRepository.save(c);
  }

  @Transactional
  public void inactivarCategoria(Long id) {
    RequestContext.requireRoles("ADMINISTRADOR");
    Categoria c =
        categoriaRepository
            .findByIdAndIdEstablecimiento(id, RequestContext.tenant())
            .orElseThrow(
                () -> new IllegalArgumentException("Categoría no encontrada con ID: " + id));
    if (!productoRepository
        .findByCategoriaIdAndIdEstablecimiento(id, RequestContext.tenant())
        .isEmpty()) {
      throw new IllegalStateException(
          "No se puede eliminar o inactivar una categoría que posee productos asociados.");
    }
    c.inactivar();
    categoriaRepository.save(c);
  }
}
