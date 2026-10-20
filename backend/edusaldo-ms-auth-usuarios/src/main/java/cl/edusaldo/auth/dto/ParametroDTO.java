package cl.edusaldo.auth.dto;

public class ParametroDTO {
    private String clave;
    private String valor;

    public ParametroDTO() {}

    public ParametroDTO(String clave, String valor) {
        this.clave = clave;
        this.valor = valor;
    }

    public String getClave() { return clave; }
    public void setClave(String clave) { this.clave = clave; }
    public String getValor() { return valor; }
    public void setValor(String valor) { this.valor = valor; }
}
