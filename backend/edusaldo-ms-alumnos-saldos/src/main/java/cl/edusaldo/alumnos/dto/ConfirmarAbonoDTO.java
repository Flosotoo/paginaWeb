package cl.edusaldo.alumnos.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class ConfirmarAbonoDTO {

    @NotBlank(message = "El token de transacción es obligatorio")
    @JsonAlias({"tokenTransaccion"})
    private String token;

    public ConfirmarAbonoDTO() {}

    public ConfirmarAbonoDTO(String token) {
        this.token = token;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
