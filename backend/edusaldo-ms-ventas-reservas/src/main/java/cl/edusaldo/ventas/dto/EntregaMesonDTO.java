package cl.edusaldo.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class EntregaMesonDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    @NotNull(message = "El ID del encargado es obligatorio")
    private Long encargadoId;

    @NotEmpty(message = "La entrega debe contener al menos un material")
    @Valid
    private List<ItemEntregaDTO> items;

    public EntregaMesonDTO() {}

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }

    public List<ItemEntregaDTO> getItems() { return items; }
    public void setItems(List<ItemEntregaDTO> items) { this.items = items; }
}
