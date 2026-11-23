package cl.edusaldo.productos.dto;
import java.util.List;
public record CrearOrdenCompraDTO(Long proveedorId, String observacion, List<Linea> detalles) {
 public record Linea(Long productoId, Integer cantidad, Long precioUnitario) {}
}
