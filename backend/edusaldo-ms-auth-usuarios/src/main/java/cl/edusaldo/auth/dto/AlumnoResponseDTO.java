package cl.edusaldo.auth.dto;

import cl.edusaldo.auth.model.Alumno;
import cl.edusaldo.auth.model.EstadoCuenta;
import cl.edusaldo.auth.model.Parentesco;
import java.time.LocalDate;

public class AlumnoResponseDTO {
    private Long id;
    private String rut;
    private String primerNombre;
    private String primerApellido;
    private String nombreCompleto;
    private String correo;
    private LocalDate fechaNacimiento;
    private int edad;
    private String curso;
    private boolean puedeIniciarSesion;
    private boolean puedeReservar;
    private EstadoCuenta estado;
    private Parentesco parentesco;

    public AlumnoResponseDTO() {
    }

    public AlumnoResponseDTO(Alumno a) {
        this.id = a.getId();
        this.rut = a.getRut();
        this.primerNombre = a.getPrimerNombre();
        this.primerApellido = a.getPrimerApellido();
        this.nombreCompleto = a.getNombreCompleto();
        this.correo = a.getCorreo();
        this.fechaNacimiento = a.getFechaNacimiento();
        this.edad = a.calcularEdad();
        this.curso = a.getCurso();
        this.puedeIniciarSesion = a.puedeIniciarSesion();
        this.puedeReservar = a.puedeReservar();
        this.estado = a.getEstado();
    }

    public AlumnoResponseDTO(Alumno a, Parentesco parentesco) {
        this(a);
        this.parentesco = parentesco;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRut() { return rut; }
    public void setRut(String rut) { this.rut = rut; }
    public String getPrimerNombre() { return primerNombre; }
    public void setPrimerNombre(String primerNombre) { this.primerNombre = primerNombre; }
    public String getPrimerApellido() { return primerApellido; }
    public void setPrimerApellido(String primerApellido) { this.primerApellido = primerApellido; }
    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }
    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public int getEdad() { return edad; }
    public void setEdad(int edad) { this.edad = edad; }
    public String getCurso() { return curso; }
    public void setCurso(String curso) { this.curso = curso; }
    public boolean isPuedeIniciarSesion() { return puedeIniciarSesion; }
    public void setPuedeIniciarSesion(boolean puedeIniciarSesion) { this.puedeIniciarSesion = puedeIniciarSesion; }
    public boolean isPuedeReservar() { return puedeReservar; }
    public void setPuedeReservar(boolean puedeReservar) { this.puedeReservar = puedeReservar; }
    public EstadoCuenta getEstado() { return estado; }
    public void setEstado(EstadoCuenta estado) { this.estado = estado; }
    public Parentesco getParentesco() { return parentesco; }
    public void setParentesco(Parentesco parentesco) { this.parentesco = parentesco; }
}
