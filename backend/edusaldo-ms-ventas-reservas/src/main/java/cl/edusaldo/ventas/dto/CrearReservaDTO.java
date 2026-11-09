package cl.edusaldo.ventas.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;

public class CrearReservaDTO {
  @NotNull private Long alumnoId;
  private Long creadaPorId;
  @NotEmpty @Valid private List<ItemReservaDTO> items;

  public Long getAlumnoId() {
    return alumnoId;
  }

  public void setAlumnoId(Long id) {
    alumnoId = id;
  }

  public Long getCreadaPorId() {
    return creadaPorId;
  }

  public void setCreadaPorId(Long id) {
    creadaPorId = id;
  }

  public List<ItemReservaDTO> getItems() {
    return items;
  }

  public void setItems(List<ItemReservaDTO> items) {
    this.items = items;
  }
}
