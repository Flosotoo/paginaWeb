package cl.edusaldo.auth.dto;

import cl.edusaldo.auth.model.EstadoCuenta;

public class LoginResponseDTO {
    private String token;
    private Long usuarioId;
    private String rut;
    private String nombreCompleto;
    private String correo;
    private String rol;
    private EstadoCuenta estado;

    public LoginResponseDTO() {}

    public LoginResponseDTO(String token, Long usuarioId, String rut, String nombreCompleto, String correo, String rol, EstadoCuenta estado) {
        this.token = token;
        this.usuarioId = usuarioId;
        this.rut = rut;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
        this.rol = rol;
        this.estado = estado;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public String getRol() { return rol; }
    public void setRol(String rol) { this.rol = rol; }
    public EstadoCuenta getEstado() { return estado; }
    public void setEstado(EstadoCuenta estado) { this.estado = estado; }
}
