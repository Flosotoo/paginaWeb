package cl.edusaldo.productos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SolicitarAjusteDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @NotNull(message = "La cantidad del ajuste es obligatoria")
    private Integer cantidad; // positivo o negativo

    @NotBlank(message = "El motivo del ajuste es obligatorio")
    private String motivo;

    @NotNull(message = "El ID del encargado solicitante es obligatorio")
    private Long encargadoId;

    public SolicitarAjusteDTO() {}

    public SolicitarAjusteDTO(Long productoId, Integer cantidad, String motivo, Long encargadoId) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.motivo = motivo;
        this.encargadoId = encargadoId;
    }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
}
