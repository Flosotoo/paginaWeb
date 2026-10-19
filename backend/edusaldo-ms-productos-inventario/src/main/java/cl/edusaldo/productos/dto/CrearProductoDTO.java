package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CrearProductoDTO {

    @NotNull(message = "El ID de categoría es obligatorio")
    private Long categoriaId;

    @NotBlank(message = "El SKU es obligatorio")
    private String sku;

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;
    private String imagenUrl;

    @NotBlank(message = "El curso/nivel es obligatorio")
    private String cursoNivel;

    @NotNull(message = "El precio es obligatorio")
    @Min(value = 0, message = "El precio no puede ser negativo")
    private Integer precio;

    @Min(value = 0, message = "El stock inicial no puede ser negativo")
    private int stockInicial = 0;

    @Min(value = 1, message = "El stock crítico debe ser al menos 1")
    private int stockCritico = 5;

    public CrearProductoDTO() {}

    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public String getCursoNivel() { return cursoNivel; }
    public void setCursoNivel(String cursoNivel) { this.cursoNivel = cursoNivel; }
    public Integer getPrecio() { return precio; }
    public void setPrecio(Integer precio) { this.precio = precio; }
    public int getStockInicial() { return stockInicial; }
    public void setStockInicial(int stockInicial) { this.stockInicial = stockInicial; }
    public int getStockCritico() { return stockCritico; }
    public void setStockCritico(int stockCritico) { this.stockCritico = stockCritico; }
}
