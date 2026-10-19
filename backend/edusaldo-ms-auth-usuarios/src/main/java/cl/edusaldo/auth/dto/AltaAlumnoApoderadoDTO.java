package cl.edusaldo.auth.dto;

import cl.edusaldo.auth.model.Parentesco;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class AltaAlumnoApoderadoDTO {

    @NotBlank(message = "El RUT del alumno es obligatorio")
    private String rutAlumno;

    @NotBlank(message = "El primer nombre del alumno es obligatorio")
    private String primerNombreAlumno;

    private String segundoNombreAlumno;

    @NotBlank(message = "El primer apellido del alumno es obligatorio")
    private String primerApellidoAlumno;

    private String segundoApellidoAlumno;

    private String correoAlumno;

    @NotNull(message = "La fecha de nacimiento del alumno es obligatoria")
    private LocalDate fechaNacimiento;

    @NotBlank(message = "El curso es obligatorio")
    private String curso;

    @NotBlank(message = "El RUT del apoderado es obligatorio")
    private String rutApoderado;

    @NotBlank(message = "El primer nombre del apoderado es obligatorio")
    private String primerNombreApoderado;

    private String segundoNombreApoderado;

    @NotBlank(message = "El primer apellido del apoderado es obligatorio")
    private String primerApellidoApoderado;

    private String segundoApellidoApoderado;

    @NotBlank(message = "El correo del apoderado es obligatorio")
    private String correoApoderado;

    private String telefonoApoderado;

    @NotNull(message = "El parentesco es obligatorio")
    private Parentesco parentesco = Parentesco.PADRE;

    public AltaAlumnoApoderadoDTO() {
    }

    public String getRutAlumno() { return rutAlumno; }
    public void setRutAlumno(String rutAlumno) { this.rutAlumno = rutAlumno; }
    public String getPrimerNombreAlumno() { return primerNombreAlumno; }
    public void setPrimerNombreAlumno(String primerNombreAlumno) { this.primerNombreAlumno = primerNombreAlumno; }
    public String getSegundoNombreAlumno() { return segundoNombreAlumno; }
    public void setSegundoNombreAlumno(String segundoNombreAlumno) { this.segundoNombreAlumno = segundoNombreAlumno; }
    public String getPrimerApellidoAlumno() { return primerApellidoAlumno; }
    public void setPrimerApellidoAlumno(String primerApellidoAlumno) { this.primerApellidoAlumno = primerApellidoAlumno; }
    public String getSegundoApellidoAlumno() { return segundoApellidoAlumno; }
    public void setSegundoApellidoAlumno(String segundoApellidoAlumno) { this.segundoApellidoAlumno = segundoApellidoAlumno; }
    public String getCorreoAlumno() { return correoAlumno; }
    public void setCorreoAlumno(String correoAlumno) { this.correoAlumno = correoAlumno; }
    public LocalDate getFechaNacimiento() { return fechaNacimiento; }
    public void setFechaNacimiento(LocalDate fechaNacimiento) { this.fechaNacimiento = fechaNacimiento; }
    public String getCurso() { return curso; }
    public void setCurso(String curso) { this.curso = curso; }
    public String getRutApoderado() { return rutApoderado; }
    public void setRutApoderado(String rutApoderado) { this.rutApoderado = rutApoderado; }
    public String getPrimerNombreApoderado() { return primerNombreApoderado; }
    public void setPrimerNombreApoderado(String primerNombreApoderado) { this.primerNombreApoderado = primerNombreApoderado; }
    public String getSegundoNombreApoderado() { return segundoNombreApoderado; }
    public void setSegundoNombreApoderado(String segundoNombreApoderado) { this.segundoNombreApoderado = segundoNombreApoderado; }
    public String getPrimerApellidoApoderado() { return primerApellidoApoderado; }
    public void setPrimerApellidoApoderado(String primerApellidoApoderado) { this.primerApellidoApoderado = primerApellidoApoderado; }
    public String getSegundoApellidoApoderado() { return segundoApellidoApoderado; }
    public void setSegundoApellidoApoderado(String segundoApellidoApoderado) { this.segundoApellidoApoderado = segundoApellidoApoderado; }
    public String getCorreoApoderado() { return correoApoderado; }
    public void setCorreoApoderado(String correoApoderado) { this.correoApoderado = correoApoderado; }
    public String getTelefonoApoderado() { return telefonoApoderado; }
    public void setTelefonoApoderado(String telefonoApoderado) { this.telefonoApoderado = telefonoApoderado; }
    public Parentesco getParentesco() { return parentesco; }
    public void setParentesco(Parentesco parentesco) { this.parentesco = parentesco; }
}
