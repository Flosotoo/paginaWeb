package cl.edusaldo.productos.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.NotBlank;

public class ActualizarProductoDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

    private String descripcion;
    @JsonIgnore
    @Hidden
    private String imagenUrl;
    private String cursoNivel;

    @Positive(message = "El precio debe ser un entero positivo mayor a 0")
    private Integer precio;

    @Min(value = 1, message = "El stock crítico debe ser al menos 1")
    private Integer stockCritico;

    private Long categoriaId;

    public ActualizarProductoDTO() {}

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    @JsonIgnore
    @Hidden
    public String getImagenUrl() { return imagenUrl; }
    @JsonIgnore
    @Hidden
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public String getCursoNivel() { return cursoNivel; }
    public void setCursoNivel(String cursoNivel) { this.cursoNivel = cursoNivel; }
    public Integer getPrecio() { return precio; }
    public void setPrecio(Integer precio) { this.precio = precio; }
    public Integer getStockCritico() { return stockCritico; }
    public void setStockCritico(Integer stockCritico) { this.stockCritico = stockCritico; }
    public Long getCategoriaId() { return categoriaId; }
    public void setCategoriaId(Long categoriaId) { this.categoriaId = categoriaId; }
}
