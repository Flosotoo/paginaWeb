package cl.edusaldo.ventas.dto;

import cl.edusaldo.ventas.model.Devolucion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class DevolucionResponseDTO {

    private Long id;
    private String codigoDevolucion;
    private Long entregaId;
    private Long alumnoId;
    private LocalDateTime fecha;
    private String motivo;
    private int totalReintegro;
    private Long encargadoId;
    private List<ItemDevolucionResponseDTO> items;

    public static class ItemDevolucionResponseDTO {
        private Long id;
        private Long detalleEntregaId;
        private Long productoId;
        private String nombreProducto;
        private int cantidad;
        private int precioUnitarioReintegro;
        private int montoReintegro;

        public ItemDevolucionResponseDTO(Long id, Long detalleEntregaId, Long productoId,
                                         String nombreProducto, int cantidad,
                                         int precioUnitarioReintegro, int montoReintegro) {
            this.id = id;
            this.detalleEntregaId = detalleEntregaId;
            this.productoId = productoId;
            this.nombreProducto = nombreProducto;
            this.cantidad = cantidad;
            this.precioUnitarioReintegro = precioUnitarioReintegro;
            this.montoReintegro = montoReintegro;
        }

        public Long getId() { return id; }
        public Long getDetalleEntregaId() { return detalleEntregaId; }
        public Long getProductoId() { return productoId; }
        public String getNombreProducto() { return nombreProducto; }
        public int getCantidad() { return cantidad; }
        public int getPrecioUnitarioReintegro() { return precioUnitarioReintegro; }
        public int getMontoReintegro() { return montoReintegro; }
    }

    public DevolucionResponseDTO() {}

    public DevolucionResponseDTO(Devolucion dev) {
        this.id = dev.getId();
        this.codigoDevolucion = dev.getCodigoDevolucion();
        this.entregaId = dev.getEntregaId();
        this.alumnoId = dev.getAlumnoId();
        this.fecha = dev.getFecha();
        this.motivo = dev.getMotivo();
        this.totalReintegro = dev.getTotalReintegro();
        this.encargadoId = dev.getEncargadoId();
        if (dev.getDetalles() != null) {
            this.items = dev.getDetalles().stream()
                    .map(d -> new ItemDevolucionResponseDTO(d.getId(), d.getDetalleEntregaId(),
                            d.getProductoId(), d.getNombreProducto(), d.getCantidad(),
                            d.getPrecioUnitarioReintegro(), d.getMontoReintegro()))
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public String getCodigoDevolucion() { return codigoDevolucion; }
    public Long getEntregaId() { return entregaId; }
    public Long getAlumnoId() { return alumnoId; }
    public LocalDateTime getFecha() { return fecha; }
    public String getMotivo() { return motivo; }
    public int getTotalReintegro() { return totalReintegro; }
    public Long getEncargadoId() { return encargadoId; }
    public List<ItemDevolucionResponseDTO> getItems() { return items; }
}
