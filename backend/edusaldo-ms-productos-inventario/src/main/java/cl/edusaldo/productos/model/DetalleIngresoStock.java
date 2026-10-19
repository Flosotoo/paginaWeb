package cl.edusaldo.productos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "detalles_ingreso_stock")
public class DetalleIngresoStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingreso_stock_id", nullable = false)
    private IngresoStock ingresoStock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    public DetalleIngresoStock() {}

    public DetalleIngresoStock(IngresoStock ingresoStock, Producto producto, int cantidad) {
        this.ingresoStock = ingresoStock;
        this.producto = producto;
        this.cantidad = cantidad;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public IngresoStock getIngresoStock() { return ingresoStock; }
    public void setIngresoStock(IngresoStock ingresoStock) { this.ingresoStock = ingresoStock; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public Long getProductoId() { return producto != null ? producto.getId() : null; }
}
