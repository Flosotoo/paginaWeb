package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class ConfirmarRecuperacionDTO {

    @NotBlank(message = "El token es obligatorio")
    private String token;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String nuevaPassword;

    public ConfirmarRecuperacionDTO() {}

    public ConfirmarRecuperacionDTO(String token, String nuevaPassword) {
        this.token = token;
        this.nuevaPassword = nuevaPassword;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getNuevaPassword() { return nuevaPassword; }
    public void setNuevaPassword(String nuevaPassword) { this.nuevaPassword = nuevaPassword; }
}
