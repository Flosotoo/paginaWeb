package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class CambiarPasswordAuthDTO {

    @NotBlank(message = "El identificador (RUT o correo) es obligatorio")
    private String identificador;

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String passwordActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String passwordNueva;

    public CambiarPasswordAuthDTO() {}

    public CambiarPasswordAuthDTO(String identificador, String passwordActual, String passwordNueva) {
        this.identificador = identificador;
        this.passwordActual = passwordActual;
        this.passwordNueva = passwordNueva;
    }

    public String getIdentificador() { return identificador; }
    public void setIdentificador(String identificador) { this.identificador = identificador; }
    public String getPasswordActual() { return passwordActual; }
    public void setPasswordActual(String passwordActual) { this.passwordActual = passwordActual; }
    public String getPasswordNueva() { return passwordNueva; }
    public void setPasswordNueva(String passwordNueva) { this.passwordNueva = passwordNueva; }
}
