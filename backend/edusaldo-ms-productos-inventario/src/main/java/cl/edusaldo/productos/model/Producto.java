package cl.edusaldo.productos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id", nullable = false)
    private Categoria categoria;

    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "descripcion")
    private String descripcion;

    @Column(name = "imagen_url")
    private String imagenUrl;

    @Column(name = "curso_nivel", nullable = false, length = 100)
    private String cursoNivel;

    @Column(name = "precio", nullable = false)
    private int precio;

    @Column(name = "stock_fisico", nullable = false)
    private int stockFisico = 0;

    @Column(name = "stock_reservado", nullable = false)
    private int stockReservado = 0;

    @Column(name = "stock_critico", nullable = false)
    private int stockCritico = 5;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 30)
    private EstadoRegistro estado = EstadoRegistro.ACTIVO;

    public Producto() {}

    public Producto(Categoria categoria, String sku, String nombre, String descripcion,
                    String imagenUrl, String cursoNivel, int precio, int stockFisico, int stockCritico) {
        this.categoria = categoria;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.imagenUrl = imagenUrl;
        this.cursoNivel = cursoNivel;
        this.precio = precio;
        this.stockFisico = stockFisico;
        this.stockReservado = 0;
        this.stockCritico = stockCritico;
        this.estado = EstadoRegistro.ACTIVO;
    }

    public int getStockDisponible() {
        return this.stockFisico - this.stockReservado;
    }

    public boolean esCritico() {
        return getStockDisponible() <= this.stockCritico;
    }

    public MovimientoInventario ingresarStockManual(int cant, Long ingresoId, Long usuarioId) {
        if (cant <= 0) {
            throw new IllegalArgumentException("La cantidad a ingresar debe ser mayor a cero.");
        }
        this.stockFisico += cant;
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.INGRESO,
                cant,
                this.stockFisico,
                LocalDateTime.now(),
                ingresoId,
                usuarioId
        );
    }

    public MovimientoInventario retenerStockPorReserva(int cant, Long reservaId, Long usuarioId) {
        if (cant <= 0) {
            throw new IllegalArgumentException("La cantidad a retener debe ser mayor a cero.");
        }
        if (cant > getStockDisponible()) {
            throw new IllegalStateException("Stock insuficiente para reservar " + cant + " unidades. Disponible: " + getStockDisponible());
        }
        this.stockReservado += cant;
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.RESERVA,
                cant,
                getStockDisponible(),
                LocalDateTime.now(),
                reservaId,
                usuarioId
        );
    }

    public MovimientoInventario liberarStockRetenido(int cant, Long reservaId, Long usuarioId) {
        if (cant <= 0) {
            throw new IllegalArgumentException("La cantidad a liberar debe ser mayor a cero.");
        }
        this.stockReservado = Math.max(0, this.stockReservado - cant);
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.LIBERACION,
                cant,
                getStockDisponible(),
                LocalDateTime.now(),
                reservaId,
                usuarioId
        );
    }

    public MovimientoInventario descontarStockPorEntrega(int cant, Long entregaId, boolean vieneDeReserva, Long usuarioId) {
        if (cant <= 0) {
            throw new IllegalArgumentException("La cantidad a descontar debe ser mayor a cero.");
        }
        if (cant > this.stockFisico) {
            throw new IllegalStateException("Stock físico insuficiente para descontar.");
        }
        if (!vieneDeReserva && cant > getStockDisponible()) {
            throw new IllegalStateException("Stock disponible insuficiente para venta directa.");
        }
        this.stockFisico -= cant;
        if (vieneDeReserva) {
            this.stockReservado = Math.max(0, this.stockReservado - cant);
        }
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.ENTREGA,
                cant,
                this.stockFisico,
                LocalDateTime.now(),
                entregaId,
                usuarioId
        );
    }

    public MovimientoInventario reponerStockPorDevolucion(int cant, Long devolucionId, Long usuarioId) {
        if (cant <= 0) {
            throw new IllegalArgumentException("La cantidad a reponer debe ser mayor a cero.");
        }
        this.stockFisico += cant;
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.DEVOLUCION,
                cant,
                this.stockFisico,
                LocalDateTime.now(),
                devolucionId,
                usuarioId
        );
    }

    public MovimientoInventario aplicarAjusteAprobado(int cant, Long solicitudId, Long adminId) {
        if (cant == 0) {
            throw new IllegalArgumentException("La cantidad del ajuste no puede ser cero.");
        }
        int nuevoFisico = this.stockFisico + cant;
        if (nuevoFisico < 0) {
            throw new IllegalStateException("El ajuste dejaría el stock físico en negativo.");
        }
        if (nuevoFisico - this.stockReservado < 0) {
            throw new IllegalStateException("El ajuste dejaría el stock disponible en negativo.");
        }
        this.stockFisico = nuevoFisico;
        return new MovimientoInventario(
                this,
                TipoMovimientoInventario.AJUSTE,
                Math.abs(cant),
                this.stockFisico,
                LocalDateTime.now(),
                solicitudId,
                adminId
        );
    }

    public void editar(String nombre, String descripcion, String imagenUrl, String cursoNivel, int precio, int stockCritico, Categoria categoria) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.imagenUrl = imagenUrl;
        this.cursoNivel = cursoNivel;
        this.precio = precio;
        this.stockCritico = stockCritico;
        if (categoria != null) {
            this.categoria = categoria;
        }
    }

    public void activar() {
        this.estado = EstadoRegistro.ACTIVO;
    }

    public void inactivar() {
        this.estado = EstadoRegistro.INACTIVO;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Categoria getCategoria() { return categoria; }
    public void setCategoria(Categoria categoria) { this.categoria = categoria; }
    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
    public String getImagenUrl() { return imagenUrl; }
    public void setImagenUrl(String imagenUrl) { this.imagenUrl = imagenUrl; }
    public String getCursoNivel() { return cursoNivel; }
    public void setCursoNivel(String cursoNivel) { this.cursoNivel = cursoNivel; }
    public int getPrecio() { return precio; }
    public void setPrecio(int precio) { this.precio = precio; }
    public int getStockFisico() { return stockFisico; }
    public void setStockFisico(int stockFisico) { this.stockFisico = stockFisico; }
    public int getStockReservado() { return stockReservado; }
    public void setStockReservado(int stockReservado) { this.stockReservado = stockReservado; }
    public int getStockCritico() { return stockCritico; }
    public void setStockCritico(int stockCritico) { this.stockCritico = stockCritico; }
    public EstadoRegistro getEstado() { return estado; }
    public void setEstado(EstadoRegistro estado) { this.estado = estado; }
}
