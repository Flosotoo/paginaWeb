package cl.edusaldo.ventas.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.Hidden;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class CrearReservaDTO {

    @NotNull(message = "El ID del alumno es obligatorio")
    private Long alumnoId;

    // Puede ser Apoderado o Alumno (>= 12 años)
    @JsonAlias({"apoderadoId"})
    private Long creadaPorId;

    // Campo de retrocompatibilidad
    @JsonIgnore
    @Hidden
    private Long apoderadoId;

    @NotEmpty(message = "La reserva debe contener al menos un material")
    @Valid
    private List<ItemReservaDTO> items;

    public CrearReservaDTO() {}

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }

    public Long getCreadaPorId() {
        if (this.creadaPorId != null) {
            return this.creadaPorId;
        }
        return this.apoderadoId;
    }

    public void setCreadaPorId(Long creadaPorId) {
        this.creadaPorId = creadaPorId;
        if (this.apoderadoId == null) {
            this.apoderadoId = creadaPorId;
        }
    }

    @JsonIgnore
    @Hidden
    public Long getApoderadoId() { return apoderadoId != null ? apoderadoId : getCreadaPorId(); }

    @JsonIgnore
    @Hidden
    public void setApoderadoId(Long apoderadoId) {
        this.apoderadoId = apoderadoId;
        if (this.creadaPorId == null) {
            this.creadaPorId = apoderadoId;
        }
    }

    public List<ItemReservaDTO> getItems() { return items; }
    public void setItems(List<ItemReservaDTO> items) { this.items = items; }
}
