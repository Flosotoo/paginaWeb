package cl.edusaldo.ventas.dto;

import cl.edusaldo.ventas.model.EstadoReserva;
import cl.edusaldo.ventas.model.Reserva;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class ReservaResponseDTO {
    private Long id;
    private String codigo;
    private Long alumnoId;
    @JsonAlias({"apoderadoId"})
    private Long creadaPorId;
    @JsonIgnore
    @Hidden
    private Long apoderadoId; // Retrocompatibilidad
    private int total;
    private EstadoReserva estado;
    private String motivoCancelacion;
    private Long canceladaPorId;
    private Long preparadaPorId; // HU31 CA2
    private LocalDateTime fechaPreparacion; // HU31 CA2
    private LocalDateTime fechaCreacion;
    private List<ItemReservaResponseDTO> items;

    public static class ItemReservaResponseDTO {
        private Long productoId;
        private String nombreProducto;
        private int cantidad;
        private int precioUnitario;
        private int subtotal;

        public ItemReservaResponseDTO(Long productoId, String nombreProducto, int cantidad, int precioUnitario) {
            this.productoId = productoId;
            this.nombreProducto = nombreProducto;
            this.cantidad = cantidad;
            this.precioUnitario = precioUnitario;
            this.subtotal = cantidad * precioUnitario;
        }

        public Long getProductoId() { return productoId; }
        public String getNombreProducto() { return nombreProducto; }
        public int getCantidad() { return cantidad; }
        public int getPrecioUnitario() { return precioUnitario; }
        public int getSubtotal() { return subtotal; }
    }

    public ReservaResponseDTO() {}

    public ReservaResponseDTO(Reserva r) {
        this.id = r.getId();
        this.codigo = r.getCodigo();
        this.alumnoId = r.getAlumnoId();
        this.creadaPorId = r.getCreadaPorId();
        this.apoderadoId = r.getCreadaPorId();
        this.total = r.getTotal();
        this.estado = r.getEstado();
        this.motivoCancelacion = r.getMotivoCancelacion();
        this.canceladaPorId = r.getCanceladaPorId();
        this.preparadaPorId = r.getPreparadaPorId();
        this.fechaPreparacion = r.getFechaPreparacion();
        this.fechaCreacion = r.getFechaCreacion();
        if (r.getDetalles() != null) {
            this.items = r.getDetalles().stream()
                    .map(d -> new ItemReservaResponseDTO(d.getProductoId(), d.getNombreProducto(), d.getCantidad(), d.getPrecioUnitario()))
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public String getCodigo() { return codigo; }
    public Long getAlumnoId() { return alumnoId; }
    public Long getCreadaPorId() { return creadaPorId; }
    @JsonIgnore
    @Hidden
    public Long getApoderadoId() { return apoderadoId != null ? apoderadoId : creadaPorId; }
    public int getTotal() { return total; }
    public EstadoReserva getEstado() { return estado; }
    public String getMotivoCancelacion() { return motivoCancelacion; }
    public Long getCanceladaPorId() { return canceladaPorId; }
    public Long getPreparadaPorId() { return preparadaPorId; }
    public LocalDateTime getFechaPreparacion() { return fechaPreparacion; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public List<ItemReservaResponseDTO> getItems() { return items; }
}
