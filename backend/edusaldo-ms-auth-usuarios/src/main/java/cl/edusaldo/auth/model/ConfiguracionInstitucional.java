package cl.edusaldo.auth.model;

import jakarta.persistence.*;

@Entity
@Table(name = "configuracion_institucional")
public class ConfiguracionInstitucional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rut_establecimiento", length = 15)
    private String rutEstablecimiento = "65.111.222-3";

    @Column(name = "nombre_establecimiento", nullable = false, length = 150)
    private String nombreEstablecimiento;

    @Column(name = "nombre_libreria", nullable = false, length = 150)
    private String nombreLibreria;

    @Column(name = "correo_contacto", nullable = false, length = 150)
    private String correoContacto;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "activo", nullable = false)
    private boolean activo = true;

    public ConfiguracionInstitucional() {
    }

    public ConfiguracionInstitucional(String nombreEstablecimiento, String nombreLibreria, String correoContacto, String logoUrl) {
        this.nombreEstablecimiento = nombreEstablecimiento;
        this.nombreLibreria = nombreLibreria;
        this.correoContacto = correoContacto;
        this.logoUrl = logoUrl;
        this.activo = true;
    }

    public void actualizar(String nombreEstablecimiento, String nombreLibreria, String correoContacto, String logoUrl) {
        if (nombreEstablecimiento != null && !nombreEstablecimiento.isBlank()) {
            this.nombreEstablecimiento = nombreEstablecimiento;
        }
        if (nombreLibreria != null && !nombreLibreria.isBlank()) {
            this.nombreLibreria = nombreLibreria;
        }
        if (correoContacto != null && !correoContacto.isBlank()) {
            this.correoContacto = correoContacto;
        }
        if (logoUrl != null) {
            this.logoUrl = logoUrl;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRutEstablecimiento() {
        return rutEstablecimiento;
    }

    public void setRutEstablecimiento(String rutEstablecimiento) {
        this.rutEstablecimiento = rutEstablecimiento;
    }

    public String getNombreEstablecimiento() {
        return nombreEstablecimiento;
    }

    public void setNombreEstablecimiento(String nombreEstablecimiento) {
        this.nombreEstablecimiento = nombreEstablecimiento;
    }

    public String getNombreLibreria() {
        return nombreLibreria;
    }

    public void setNombreLibreria(String nombreLibreria) {
        this.nombreLibreria = nombreLibreria;
    }

    public String getCorreoContacto() {
        return correoContacto;
    }

    public void setCorreoContacto(String correoContacto) {
        this.correoContacto = correoContacto;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
