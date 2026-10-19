package cl.edusaldo.productos.dto;

import cl.edusaldo.productos.model.MovimientoInventario;
import cl.edusaldo.productos.model.TipoMovimientoInventario;
import java.time.LocalDateTime;

public class MovimientoInventarioResponseDTO {
    private Long id;
    private Long productoId;
    private String nombreProducto;
    private TipoMovimientoInventario tipo;
    private int cantidad;
    private int stockResultante;
    private LocalDateTime fecha;
    private Long referenciaId;
    private Long usuarioId;

    public MovimientoInventarioResponseDTO() {}

    public MovimientoInventarioResponseDTO(MovimientoInventario m) {
        this.id = m.getId();
        if (m.getProducto() != null) {
            this.productoId = m.getProducto().getId();
            this.nombreProducto = m.getProducto().getNombre();
        }
        this.tipo = m.getTipo();
        this.cantidad = m.getCantidad();
        this.stockResultante = m.getStockResultante();
        this.fecha = m.getFecha();
        this.referenciaId = m.getReferenciaId();
        this.usuarioId = m.getUsuarioId();
    }

    public Long getId() { return id; }
    public Long getProductoId() { return productoId; }
    public String getNombreProducto() { return nombreProducto; }
    public TipoMovimientoInventario getTipo() { return tipo; }
    public int getCantidad() { return cantidad; }
    public int getStockResultante() { return stockResultante; }
    public LocalDateTime getFecha() { return fecha; }
    public Long getReferenciaId() { return referenciaId; }
    public Long getUsuarioId() { return usuarioId; }
}
