package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ConfiguracionDTO {
    @NotBlank @Size(max = 150) private String nombreEstablecimiento;
    @NotBlank @Size(max = 150) private String nombreLibreria;
    @NotBlank @Email @Size(max = 150) private String correoContacto;
    @Size(max = 255) private String logoUrl;

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
