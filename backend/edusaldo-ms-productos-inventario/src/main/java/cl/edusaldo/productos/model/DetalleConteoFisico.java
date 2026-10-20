package cl.edusaldo.productos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "detalles_conteo_fisico")
public class DetalleConteoFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conteo_fisico_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_detalle_conteo_conteo"))
    private ConteoFisico conteoFisico;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_detalle_conteo_producto"))
    private Producto producto;

    @Column(name = "stock_sistema", nullable = false)
    private int stockSistema;

    @Column(name = "stock_contado", nullable = false)
    private int stockContado;

    @Column(name = "diferencia", nullable = false)
    private int diferencia;

    public DetalleConteoFisico() {}

    public DetalleConteoFisico(ConteoFisico conteoFisico, Producto producto, int stockSistema, int stockContado) {
        this.conteoFisico = conteoFisico;
        this.producto = producto;
        this.stockSistema = stockSistema;
        this.stockContado = stockContado;
        this.diferencia = stockContado - stockSistema;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public ConteoFisico getConteoFisico() { return conteoFisico; }
    public void setConteoFisico(ConteoFisico conteoFisico) { this.conteoFisico = conteoFisico; }
    public Long getConteoFisicoId() { return conteoFisico != null ? conteoFisico.getId() : null; }
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    public Long getProductoId() { return producto != null ? producto.getId() : null; }
    public String getNombreProducto() { return producto != null ? producto.getNombre() : null; }
    public int getStockSistema() { return stockSistema; }
    public void setStockSistema(int stockSistema) { this.stockSistema = stockSistema; }
    public int getStockContado() { return stockContado; }
    public void setStockContado(int stockContado) { this.stockContado = stockContado; }
    public int getDiferencia() { return diferencia; }
    public void setDiferencia(int diferencia) { this.diferencia = diferencia; }
}
