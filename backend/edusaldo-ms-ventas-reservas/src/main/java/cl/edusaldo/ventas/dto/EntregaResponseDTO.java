package cl.edusaldo.ventas.dto;

import cl.edusaldo.ventas.model.Entrega;
import cl.edusaldo.ventas.model.OrigenEntrega;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class EntregaResponseDTO {

    private Long id;
    private String numero;
    private Long reservaId;
    private Long alumnoId;
    private OrigenEntrega origen;
    private LocalDateTime fecha;
    private int total;
    private Long encargadoId;
    private List<ItemEntregaResponseDTO> items;

    public static class ItemEntregaResponseDTO {
        private Long id;
        private Long productoId;
        private String nombreProducto;
        private int cantidad;
        private int precioUnitario;
        private int subtotal;
        private int cantidadDevuelta;

        public ItemEntregaResponseDTO(Long id, Long productoId, String nombreProducto, int cantidad, int precioUnitario, int cantidadDevuelta) {
            this.id = id;
            this.productoId = productoId;
            this.nombreProducto = nombreProducto;
            this.cantidad = cantidad;
            this.precioUnitario = precioUnitario;
            this.subtotal = cantidad * precioUnitario;
            this.cantidadDevuelta = cantidadDevuelta;
        }

        public Long getId() { return id; }
        public Long getProductoId() { return productoId; }
        public String getNombreProducto() { return nombreProducto; }
        public int getCantidad() { return cantidad; }
        public int getPrecioUnitario() { return precioUnitario; }
        public int getSubtotal() { return subtotal; }
        public int getCantidadDevuelta() { return cantidadDevuelta; }
    }

    public EntregaResponseDTO() {}

    public EntregaResponseDTO(Entrega e) {
        this.id = e.getId();
        this.numero = e.getNumero();
        this.reservaId = e.getReservaId();
        this.alumnoId = e.getAlumnoId();
        this.origen = e.getOrigen();
        this.fecha = e.getFecha();
        this.total = e.getTotal();
        this.encargadoId = e.getEncargadoId();
        if (e.getDetalles() != null) {
            this.items = e.getDetalles().stream()
                    .map(d -> new ItemEntregaResponseDTO(d.getId(), d.getProductoId(), d.getNombreProducto(),
                            d.getCantidad(), d.getPrecioUnitario(), d.getCantidadDevuelta()))
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public Long getReservaId() { return reservaId; }
    public Long getAlumnoId() { return alumnoId; }
    public OrigenEntrega getOrigen() { return origen; }
    public LocalDateTime getFecha() { return fecha; }
    public int getTotal() { return total; }
    public Long getEncargadoId() { return encargadoId; }
    public List<ItemEntregaResponseDTO> getItems() { return items; }
}
