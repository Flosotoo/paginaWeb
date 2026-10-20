package cl.edusaldo.auth.dto;

import cl.edusaldo.auth.model.Alumno;
import cl.edusaldo.auth.model.Apoderado;
import cl.edusaldo.auth.model.EstadoCuenta;
import cl.edusaldo.auth.model.Usuario;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class UsuarioResponseDTO {
    private Long id;
    private String rut;
    private String primerNombre;
    private String segundoNombre;
    private String primerApellido;
    private String segundoApellido;
    private String nombreCompleto;
    private String correo;
    private String telefono;
    private String rol;
    private EstadoCuenta estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime ultimoAcceso;

    // Campos específicos de Alumno
    private String curso;
    private LocalDate fechaNacimiento;
    private Integer edad;
    private Boolean puedeIniciarSesion;
    private Boolean puedeReservar;

    public UsuarioResponseDTO() {}

    public UsuarioResponseDTO(Usuario u) {
        this.id = u.getId();
        this.rut = u.getRut();
        this.primerNombre = u.getPrimerNombre();
        this.segundoNombre = u.getSegundoNombre();
        this.primerApellido = u.getPrimerApellido();
        this.segundoApellido = u.getSegundoApellido();
        this.nombreCompleto = u.getNombreCompleto();
        this.correo = u.getCorreo();
        this.rol = u.getRol();
        this.estado = u.getEstado();
        this.fechaCreacion = u.getFechaCreacion();
        this.ultimoAcceso = u.getUltimoAcceso();

        if (u instanceof Apoderado apoderado) {
            this.telefono = apoderado.getTelefono();
        } else if (u instanceof Alumno alumno) {
            this.curso = alumno.getCurso();
            this.fechaNacimiento = alumno.getFechaNacimiento();
            this.edad = alumno.calcularEdad();
            this.puedeIniciarSesion = alumno.puedeIniciarSesion();
            this.puedeReservar = alumno.puedeReservar();
        }
    }

    public Long getId() { return id; }
    public String getRut() { return rut; }
    public String getPrimerNombre() { return primerNombre; }
    public String getSegundoNombre() { return segundoNombre; }
    public String getPrimerApellido() { return primerApellido; }
    public String getSegundoApellido() { return segundoApellido; }
    public String getNombreCompleto() { return nombreCompleto; }
    public String getCorreo() { return correo; }
    public String getTelefono() { return telefono; }
    public String getRol() { return rol; }
    public EstadoCuenta getEstado() { return estado; }
    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public LocalDateTime getUltimoAcceso() { return ultimoAcceso; }
    public String getCurso() { return curso; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public Integer getEdad() { return edad; }
    public Boolean getPuedeIniciarSesion() { return puedeIniciarSesion; }
    public Boolean getPuedeReservar() { return puedeReservar; }
}
