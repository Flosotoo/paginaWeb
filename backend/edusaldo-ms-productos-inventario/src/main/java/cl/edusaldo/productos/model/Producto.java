package cl.edusaldo.productos.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "productos",
    uniqueConstraints =
        @UniqueConstraint(
            name = "uq_producto_sku_establecimiento",
            columnNames = {"id_establecimiento", "sku"}),
    indexes = {@Index(name = "idx_productos_establecimiento", columnList = "id_establecimiento")})
public class Producto {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "id_establecimiento", nullable = false)
  private Long idEstablecimiento = 1L;

  @JsonIgnore
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(
      name = "categoria_id",
      nullable = false,
      foreignKey = @ForeignKey(name = "fk_producto_categoria"))
  private Categoria categoria;

  @Column(name = "sku", nullable = false, length = 50)
  private String sku;

  @Column(name = "nombre", nullable = false, length = 150)
  private String nombre;

  @Column(name = "descripcion")
  private String descripcion;

  @Transient @JsonIgnore @Hidden private String imagenUrl;

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

  @Version
  @Column(name = "version", nullable = false)
  private Long version = 0L;

  @Enumerated(EnumType.STRING)
  @Column(name = "estado", nullable = false, length = 30)
  private EstadoRegistro estado = EstadoRegistro.ACTIVO;

  public Producto() {
    this.idEstablecimiento = 1L;
  }

  public Producto(
      Categoria categoria,
      String sku,
      String nombre,
      String descripcion,
      String imagenUrl,
      String cursoNivel,
      int precio,
      int stockFisico,
      int stockCritico) {
    validarValores(precio, stockFisico, stockCritico);
    this.idEstablecimiento = categoria != null ? categoria.getIdEstablecimiento() : 1L;
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
    this.version = 0L;
    this.estado = EstadoRegistro.ACTIVO;
  }

  public int getStockDisponible() {
    return Math.subtractExact(this.stockFisico, this.stockReservado);
  }

  public boolean esCritico() {
    return getStockDisponible() <= this.stockCritico;
  }

  public MovimientoInventario ingresarStockManual(int cant, Long ingresoId, Long usuarioId) {
    if (cant <= 0) {
      throw new IllegalArgumentException("La cantidad a ingresar debe ser mayor a cero.");
    }
    this.stockFisico = Math.addExact(this.stockFisico, cant);
    return new MovimientoInventario(
        this,
        TipoMovimientoInventario.INGRESO,
        cant,
        this.stockFisico,
        LocalDateTime.now(),
        ingresoId,
        usuarioId);
  }

  public MovimientoInventario retenerStockPorReserva(int cant, Long reservaId, Long usuarioId) {
    if (cant <= 0) {
      throw new IllegalArgumentException("La cantidad a retener debe ser mayor a cero.");
    }
    if (cant > getStockDisponible()) {
      throw new IllegalStateException(
          "Stock insuficiente para reservar "
              + cant
              + " unidades. Disponible: "
              + getStockDisponible());
    }
    this.stockReservado = Math.addExact(this.stockReservado, cant);
    return new MovimientoInventario(
        this,
        TipoMovimientoInventario.RESERVA,
        cant,
        getStockDisponible(),
        LocalDateTime.now(),
        reservaId,
        usuarioId);
  }

  public MovimientoInventario liberarStockRetenido(int cant, Long reservaId, Long usuarioId) {
    if (cant <= 0) {
      throw new IllegalArgumentException("La cantidad a liberar debe ser mayor a cero.");
    }
    if (cant > this.stockReservado)
      throw new IllegalStateException("La cantidad supera el stock reservado");
    this.stockReservado = Math.subtractExact(this.stockReservado, cant);
    return new MovimientoInventario(
        this,
        TipoMovimientoInventario.LIBERACION,
        cant,
        getStockDisponible(),
        LocalDateTime.now(),
        reservaId,
        usuarioId);
  }

  public MovimientoInventario descontarStockPorEntrega(
      int cant, Long entregaId, boolean vieneDeReserva, Long usuarioId) {
    if (cant <= 0) {
      throw new IllegalArgumentException("La cantidad a descontar debe ser mayor a cero.");
    }
    if (cant > this.stockFisico) {
      throw new IllegalStateException("Stock físico insuficiente para descontar.");
    }
    if (!vieneDeReserva && cant > getStockDisponible()) {
      throw new IllegalStateException("Stock disponible insuficiente para venta directa.");
    }
    if (vieneDeReserva && cant > this.stockReservado)
      throw new IllegalStateException("La cantidad supera el stock reservado");
    this.stockFisico = Math.subtractExact(this.stockFisico, cant);
    if (vieneDeReserva) this.stockReservado = Math.subtractExact(this.stockReservado, cant);
    MovimientoInventario movimiento =
        new MovimientoInventario(
            this,
            TipoMovimientoInventario.ENTREGA,
            cant,
            this.stockFisico,
            LocalDateTime.now(),
            entregaId,
            usuarioId);
    movimiento.setVariacionReservada(vieneDeReserva ? Math.negateExact(cant) : 0);
    return movimiento;
  }

  public MovimientoInventario reponerStockPorDevolucion(
      int cant, Long devolucionId, Long usuarioId) {
    return reponerStock(cant, devolucionId, usuarioId, TipoMovimientoInventario.DEVOLUCION);
  }

  public MovimientoInventario reponerStockPorCompensacion(int cant, Long operacionId, Long usuarioId) {
    return reponerStock(cant, operacionId, usuarioId, TipoMovimientoInventario.COMPENSACION);
  }

  private MovimientoInventario reponerStock(
      int cant, Long referenciaId, Long usuarioId, TipoMovimientoInventario tipo) {
    if (cant <= 0) {
      throw new IllegalArgumentException("La cantidad a reponer debe ser mayor a cero.");
    }
    this.stockFisico = Math.addExact(this.stockFisico, cant);
    return new MovimientoInventario(
        this,
        tipo,
        cant,
        this.stockFisico,
        LocalDateTime.now(),
        referenciaId,
        usuarioId);
  }

  public MovimientoInventario aplicarAjusteAprobado(int cant, Long solicitudId, Long adminId) {
    if (cant == 0) {
      throw new IllegalArgumentException("La cantidad del ajuste no puede ser cero.");
    }
    int nuevoFisico = Math.addExact(this.stockFisico, cant);
    if (nuevoFisico < 0) {
      throw new IllegalStateException("El ajuste dejaría el stock físico en negativo.");
    }
    if (Math.subtractExact(nuevoFisico, this.stockReservado) < 0) {
      throw new IllegalStateException("El ajuste dejaría el stock disponible en negativo.");
    }
    this.stockFisico = nuevoFisico;
    MovimientoInventario mov =
        new MovimientoInventario(
            this,
            TipoMovimientoInventario.AJUSTE,
            Math.abs(cant),
            this.stockFisico,
            LocalDateTime.now(),
            solicitudId,
            adminId);
    mov.setVariacionFisica(cant);
    return mov;
  }

  private static void validarValores(int precio, int stockFisico, int stockCritico) {
    if (precio <= 0 || stockFisico < 0 || stockCritico < 0)
      throw new IllegalArgumentException("Precio positivo y existencias no negativas requeridos");
  }

  public void editar(
      String nombre,
      String descripcion,
      String imagenUrl,
      String cursoNivel,
      int precio,
      int stockCritico,
      Categoria categoria) {
    validarValores(precio, this.stockFisico, stockCritico);
    if (categoria != null && !getIdEstablecimiento().equals(categoria.getIdEstablecimiento()))
      throw new IllegalArgumentException("Categoría de otro establecimiento");
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

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getIdEstablecimiento() {
    return idEstablecimiento != null ? idEstablecimiento : 1L;
  }

  public void setIdEstablecimiento(Long idEstablecimiento) {
    this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
  }

  public Long getCategoriaId() {
    return categoria != null ? categoria.getId() : null;
  }

  public Categoria getCategoria() {
    return categoria;
  }

  public void setCategoria(Categoria categoria) {
    this.categoria = categoria;
  }

  public String getSku() {
    return sku;
  }

  public void setSku(String sku) {
    this.sku = sku;
  }

  public String getNombre() {
    return nombre;
  }

  public void setNombre(String nombre) {
    this.nombre = nombre;
  }

  public String getDescripcion() {
    return descripcion;
  }

  public void setDescripcion(String descripcion) {
    this.descripcion = descripcion;
  }

  @JsonIgnore
  @Hidden
  public String getImagenUrl() {
    return imagenUrl;
  }

  @JsonIgnore
  @Hidden
  public void setImagenUrl(String imagenUrl) {
    this.imagenUrl = imagenUrl;
  }

  public String getCursoNivel() {
    return cursoNivel;
  }

  public void setCursoNivel(String cursoNivel) {
    this.cursoNivel = cursoNivel;
  }

  public int getPrecio() {
    return precio;
  }

  public void setPrecio(int precio) {
    this.precio = precio;
  }

  public int getStockFisico() {
    return stockFisico;
  }

  public void setStockFisico(int stockFisico) {
    this.stockFisico = stockFisico;
  }

  public int getStockReservado() {
    return stockReservado;
  }

  public void setStockReservado(int stockReservado) {
    this.stockReservado = stockReservado;
  }

  public int getStockCritico() {
    return stockCritico;
  }

  public void setStockCritico(int stockCritico) {
    this.stockCritico = stockCritico;
  }

  public Long getVersion() {
    return version != null ? version : 0L;
  }

  public void setVersion(Long version) {
    this.version = version != null ? version : 0L;
  }

  public EstadoRegistro getEstado() {
    return estado;
  }

  public void setEstado(EstadoRegistro estado) {
    this.estado = estado;
  }
}
