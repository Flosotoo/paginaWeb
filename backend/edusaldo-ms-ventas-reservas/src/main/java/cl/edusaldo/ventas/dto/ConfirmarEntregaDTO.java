package cl.edusaldo.ventas.dto;

public class ConfirmarEntregaDTO {
    private Long encargadoId;

    public ConfirmarEntregaDTO() {}

    public ConfirmarEntregaDTO(Long encargadoId) {
        this.encargadoId = encargadoId;
    }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
}
