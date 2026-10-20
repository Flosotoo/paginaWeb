package cl.edusaldo.productos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_establecimiento", nullable = false)
    private Long idEstablecimiento = 1L;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_movimiento_producto"))
    private Producto producto;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitud_ajuste_id",
            foreignKey = @ForeignKey(name = "fk_movimiento_solicitud_ajuste"))
    private SolicitudAjusteStock solicitudAjuste;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 50)
    private TipoMovimientoInventario tipo;

    @Column(name = "cantidad", nullable = false)
    private int cantidad;

    @Column(name = "variacion_fisica", nullable = false)
    private int variacionFisica = 0;

    @Column(name = "variacion_reservada", nullable = false)
    private int variacionReservada = 0;

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

    public MovimientoInventario() {
        this.idEstablecimiento = 1L;
    }

    public MovimientoInventario(Producto producto, TipoMovimientoInventario tipo, int cantidad,
                                int stockResultante, LocalDateTime fecha, Long referenciaId, Long usuarioId) {
        this.idEstablecimiento = producto != null ? producto.getIdEstablecimiento() : 1L;
        this.producto = producto;
        this.tipo = tipo;
        this.cantidad = cantidad;
        this.stockResultante = stockResultante;
        this.fecha = fecha != null ? fecha : LocalDateTime.now();
        this.referenciaId = referenciaId;
        this.usuarioId = usuarioId;
        if (tipo != null) {
            switch (tipo) {
                case INGRESO, DEVOLUCION -> {
                    this.variacionFisica = cantidad;
                    this.variacionReservada = 0;
                }
                case ENTREGA -> {
                    this.variacionFisica = -cantidad;
                    this.variacionReservada = 0;
                }
                case RESERVA -> {
                    this.variacionFisica = 0;
                    this.variacionReservada = cantidad;
                }
                case LIBERACION -> {
                    this.variacionFisica = 0;
                    this.variacionReservada = -cantidad;
                }
                case AJUSTE -> {
                    this.variacionFisica = cantidad;
                    this.variacionReservada = 0;
                }
            }
        }
    }

    public MovimientoInventario(Producto producto, TipoMovimientoInventario tipo, int cantidad,
                                int stockResultante, LocalDateTime fecha, Long referenciaId, Long usuarioId, String idempotencyKey) {
        this(producto, tipo, cantidad, stockResultante, fecha, referenciaId, usuarioId);
        this.idempotencyKey = idempotencyKey;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getIdEstablecimiento() { return idEstablecimiento != null ? idEstablecimiento : 1L; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Long getProductoId() { return producto != null ? producto.getId() : null; }
    public SolicitudAjusteStock getSolicitudAjuste() { return solicitudAjuste; }
    public void setSolicitudAjuste(SolicitudAjusteStock solicitudAjuste) { this.solicitudAjuste = solicitudAjuste; }
    public TipoMovimientoInventario getTipo() { return tipo; }
    public void setTipo(TipoMovimientoInventario tipo) { this.tipo = tipo; }
    public int getCantidad() { return cantidad; }
    public void setCantidad(int cantidad) { this.cantidad = cantidad; }
    public int getVariacionFisica() { return variacionFisica; }
    public void setVariacionFisica(int variacionFisica) { this.variacionFisica = variacionFisica; }
    public int getVariacionReservada() { return variacionReservada; }
    public void setVariacionReservada(int variacionReservada) { this.variacionReservada = variacionReservada; }
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
