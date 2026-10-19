package cl.edusaldo.ventas.dto;

public class MarcarListaDTO {
    private Long encargadoId;

    public MarcarListaDTO() {}

    public MarcarListaDTO(Long encargadoId) {
        this.encargadoId = encargadoId;
    }

    public Long getEncargadoId() { return encargadoId; }
    public void setEncargadoId(Long encargadoId) { this.encargadoId = encargadoId; }
}
