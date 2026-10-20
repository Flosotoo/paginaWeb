package cl.edusaldo.auth.dto;

public class ParametroDTO {
    private Long idEstablecimiento = 1L;
    private String clave;
    private String valor;
    private String descripcion;

    public ParametroDTO() {}

    public ParametroDTO(String clave, String valor) {
        this(1L, clave, valor, null);
    }

    public ParametroDTO(Long idEstablecimiento, String clave, String valor, String descripcion) {
        this.idEstablecimiento = idEstablecimiento != null ? idEstablecimiento : 1L;
        this.clave = clave;
        this.valor = valor;
        this.descripcion = descripcion;
    }

    public Long getIdEstablecimiento() { return idEstablecimiento; }
    public void setIdEstablecimiento(Long idEstablecimiento) { this.idEstablecimiento = idEstablecimiento; }
    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }
    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }
    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
}
