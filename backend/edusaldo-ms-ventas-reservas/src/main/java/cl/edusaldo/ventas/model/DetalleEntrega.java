package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "detalles_entrega")
public class DetalleEntrega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entrega_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_detalle_entrega_entrega"))
    @JsonIgnore
    private Entrega entrega;

    @Column(name = "producto_id", nullable = false)
    private Long productoId; // Ref escalar a MS Productos

    @Column(name = "nombre_producto", nullable = false, length = 150)
    private String nombreProducto;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    @Column(name = "precio_unitario", nullable = false)
    private int precioUnitario; // CLP en int

    @Column(name = "cantidad_devuelta", nullable = false)
    private int cantidadDevuelta = 0;

    public DetalleEntrega() {}

    public DetalleEntrega(Entrega entrega, Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
        this.entrega = entrega;
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.cantidadDevuelta = 0;
    }

    public int getSubtotal() {
        return this.cantidad * this.precioUnitario;
    }

    public int getCantidadDisponibleParaDevolucion() {
        return this.cantidad - this.cantidadDevuelta;
    }

    public void registrarDevolucion(int cantidadAReintegrar) {
        if (cantidadAReintegrar <= 0) {
            throw new IllegalArgumentException("La cantidad a devolver debe ser mayor a 0.");
        }
        if (cantidadAReintegrar > getCantidadDisponibleParaDevolucion()) {
            throw new IllegalStateException("La cantidad a devolver (" + cantidadAReintegrar + 
                    ") excede la cantidad disponible (" + getCantidadDisponibleParaDevolucion() + ").");
        }
        this.cantidadDevuelta += cantidadAReintegrar;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Entrega getEntrega() { return entrega; }
    public void setEntrega(Entrega entrega) { this.entrega = entrega; }

    public Long getEntregaId() { return entrega != null ? entrega.getId() : null; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }

    public int getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(int precioUnitario) { this.precioUnitario = precioUnitario; }

    public int getCantidadDevuelta() { return cantidadDevuelta; }
    public void setCantidadDevuelta(int cantidadDevuelta) { this.cantidadDevuelta = cantidadDevuelta; }
}
