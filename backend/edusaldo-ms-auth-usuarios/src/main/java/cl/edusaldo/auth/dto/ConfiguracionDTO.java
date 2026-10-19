package cl.edusaldo.auth.dto;

public class ConfiguracionDTO {
    private String nombreEstablecimiento;
    private String nombreLibreria;
    private String correoContacto;
    private String logoUrl;

    public ConfiguracionDTO() {}

    public ConfiguracionDTO(String nombreEstablecimiento, String nombreLibreria, String correoContacto, String logoUrl) {
        this.nombreEstablecimiento = nombreEstablecimiento;
        this.nombreLibreria = nombreLibreria;
        this.correoContacto = correoContacto;
        this.logoUrl = logoUrl;
    }

    public String getNombreEstablecimiento() { return nombreEstablecimiento; }
    public void setNombreEstablecimiento(String nombreEstablecimiento) { this.nombreEstablecimiento = nombreEstablecimiento; }
    public String getNombreLibreria() { return nombreLibreria; }
    public void setNombreLibreria(String nombreLibreria) { this.nombreLibreria = nombreLibreria; }
    public String getCorreoContacto() { return correoContacto; }
    public void setCorreoContacto(String correoContacto) { this.correoContacto = correoContacto; }
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
}
