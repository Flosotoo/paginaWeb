package cl.edusaldo.productos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "detalles_reserva_stock")
public class DetalleReservaStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_stock_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_det_res_stock_cabecera"))
    private ReservaStock reservaStock;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_det_res_stock_producto"))
    private Producto producto;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    public DetalleReservaStock() {}

    public DetalleReservaStock(ReservaStock reservaStock, Producto producto, int cantidad) {
        this.reservaStock = reservaStock;
        this.producto = producto;
        this.cantidad = cantidad;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ReservaStock getReservaStock() { return reservaStock; }
    public void setReservaStock(ReservaStock reservaStock) { this.reservaStock = reservaStock; }
    public Long getReservaStockId() { return reservaStock != null ? reservaStock.getId() : null; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Long getProductoId() { return producto != null ? producto.getId() : null; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
}
