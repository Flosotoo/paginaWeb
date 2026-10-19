package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 50)
    private TipoMovimientoInventario tipo;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    @Column(name = "stock_resultante", nullable = false)
    private int stockResultante;

    @Column(name = "fecha", nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    @Column(name = "referencia_id")
    private Long referenciaId;

    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @Column(name = "idempotency_key", length = 100)
    private String idempotencyKey;

    public MovimientoInventario() {}

    public MovimientoInventario(Producto producto, TipoMovimientoInventario tipo, int cantidad,
                                int stockResultante, LocalDateTime fecha, Long referenciaId, Long usuarioId) {
        this.producto = producto;
        this.tipo = tipo;
        this.cantidad = cantidad;
        this.stockResultante = stockResultante;
        this.fecha = fecha != null ? fecha : LocalDateTime.now();
        this.referenciaId = referenciaId;
        this.usuarioId = usuarioId;
    }

    public MovimientoInventario(Producto producto, TipoMovimientoInventario tipo, int cantidad,
                                int stockResultante, LocalDateTime fecha, Long referenciaId, Long usuarioId, String idempotencyKey) {
        this(producto, tipo, cantidad, stockResultante, fecha, referenciaId, usuarioId);
        this.idempotencyKey = idempotencyKey;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public TipoMovimientoInventario getTipo() { return tipo; }
    public void setTipo(TipoMovimientoInventario tipo) { this.tipo = tipo; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public int getStockResultante() { return stockResultante; }
    public void setStockResultante(int stockResultante) { this.stockResultante = stockResultante; }
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }
    public Long getReferenciaId() { return referenciaId; }
    public void setReferenciaId(Long referenciaId) { this.referenciaId = referenciaId; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }
}
