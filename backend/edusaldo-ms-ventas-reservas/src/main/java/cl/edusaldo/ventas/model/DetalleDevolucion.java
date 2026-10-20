package cl.edusaldo.ventas.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "detalles_devolucion")
public class DetalleDevolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devolucion_id", nullable = false)
    @JsonIgnore
    private Devolucion devolucion;

    @Column(name = "detalle_entrega_id", nullable = false)
    private Long detalleEntregaId; // Ref a la línea de entrega revertida

    @Column(name = "producto_id", nullable = false)
    private Long productoId; // Ref escalar a MS Productos

    @Column(name = "nombre_producto", nullable = false, length = 150)
    private String nombreProducto;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    @Column(name = "precio_unitario_reintegro", nullable = false)
    private int precioUnitarioReintegro; // CLP en int

    @Column(name = "monto_reintegro", nullable = false)
    private int montoReintegro; // CLP en int

    public DetalleDevolucion() {}

    public DetalleDevolucion(Devolucion devolucion, Long detalleEntregaId, Long productoId,
                             String nombreProducto, int cantidad, int precioUnitarioReintegro) {
        this.devolucion = devolucion;
        this.detalleEntregaId = detalleEntregaId;
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.cantidad = cantidad;
        this.precioUnitarioReintegro = precioUnitarioReintegro;
        this.montoReintegro = cantidad * precioUnitarioReintegro;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Devolucion getDevolucion() { return devolucion; }
    public void setDevolucion(Devolucion devolucion) { this.devolucion = devolucion; }

    public Long getDetalleEntregaId() { return detalleEntregaId; }
    public void setDetalleEntregaId(Long detalleEntregaId) { this.detalleEntregaId = detalleEntregaId; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }

    public int getPrecioUnitarioReintegro() { return precioUnitarioReintegro; }
    public void setPrecioUnitarioReintegro(int precioUnitarioReintegro) { this.precioUnitarioReintegro = precioUnitarioReintegro; }

    public int getMontoReintegro() { return montoReintegro; }
    public void setMontoReintegro(int montoReintegro) { this.montoReintegro = montoReintegro; }
}
