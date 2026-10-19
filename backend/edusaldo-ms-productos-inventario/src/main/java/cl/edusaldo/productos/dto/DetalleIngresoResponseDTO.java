package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.DetalleIngresoStock;

public class DetalleIngresoResponseDTO {
    private Long id;
    private Long productoId;
    private String nombreProducto;
    private int cantidad;

    public DetalleIngresoResponseDTO() {}

    public DetalleIngresoResponseDTO(DetalleIngresoStock d) {
        this.id = d.getId();
        if (d.getProducto() != null) {
            this.productoId = d.getProducto().getId();
            this.nombreProducto = d.getProducto().getNombre();
        }
        this.cantidad = d.getCantidad();
    }

    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getNombreProducto() { return nombreProducto; }
    public int getCantidad() { return cantidad; }
}
