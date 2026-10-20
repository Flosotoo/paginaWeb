package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequestDTO {

    @NotBlank(message = "El RUT o correo es obligatorio")
    private String identificador;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    public LoginRequestDTO() {}

    public LoginRequestDTO(String identificador, String password) {
        this.identificador = identificador;
        this.password = password;
    }

    public String getIdentificador() { return identificador; }
    public void setIdentificador(String identificador) { this.identificador = identificador; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
