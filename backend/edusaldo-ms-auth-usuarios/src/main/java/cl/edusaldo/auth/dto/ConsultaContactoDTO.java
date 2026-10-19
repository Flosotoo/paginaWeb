package cl.edusaldo.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class ConsultaContactoDTO {

    @NotBlank(message = "El primer nombre es obligatorio")
    private String primerNombre;

    @NotBlank(message = "El primer apellido es obligatorio")
    private String primerApellido;

    @NotBlank(message = "El correo es obligatorio")
    @Email(message = "Formato de correo inválido")
    private String correo;

    @NotBlank(message = "El mensaje es obligatorio")
    private String mensaje;

    public ConsultaContactoDTO() {}

    public ConsultaContactoDTO(String primerNombre, String primerApellido, String correo, String mensaje) {
        this.primerNombre = primerNombre;
        this.primerApellido = primerApellido;
        this.correo = correo;
        this.mensaje = mensaje;
    }

    public String getPrimerNombre() { return primerNombre; }
    public void setPrimerNombre(String primerNombre) { this.primerNombre = primerNombre; }
    public String getPrimerApellido() { return primerApellido; }
    public void setPrimerApellido(String primerApellido) { this.primerApellido = primerApellido; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
}
