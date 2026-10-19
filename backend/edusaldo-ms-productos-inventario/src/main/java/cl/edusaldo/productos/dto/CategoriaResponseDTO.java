package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.Categoria;
import cl.edusaldo.productos.model.EstadoRegistro;

public class CategoriaResponseDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private EstadoRegistro estado;

    public CategoriaResponseDTO() {}

    public CategoriaResponseDTO(Categoria c) {
        this.id = c.getId();
        this.nombre = c.getNombre();
        this.descripcion = c.getDescripcion();
        this.estado = c.getEstado();
    }

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public String getDescripcion() { return descripcion; }
    public EstadoRegistro getEstado() { return estado; }
}
