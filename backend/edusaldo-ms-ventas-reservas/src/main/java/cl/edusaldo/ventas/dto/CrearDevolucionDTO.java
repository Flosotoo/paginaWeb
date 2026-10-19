package cl.edusaldo.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CrearDevolucionDTO {

    @NotNull(message = "El ID de la entrega es obligatorio")
    private Long entregaId;

    @NotNull(message = "El ID del encargado es obligatorio")
    private Long encargadoId;

    @NotBlank(message = "El motivo de la devolución es obligatorio")
    private String motivo;

    @NotEmpty(message = "Debe incluir al menos un ítem a devolver")
    @Valid
    private List<ItemDevolucionDTO> items;

    public CrearDevolucionDTO() {}

    public Long getEntregaId() { return entregaId; }
    public void setEntregaId(Long entregaId) { this.entregaId = entregaId; }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public List<ItemDevolucionDTO> getItems() { return items; }
    public void setItems(List<ItemDevolucionDTO> items) { this.items = items; }
}
