package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("ALUMNO")
public class Alumno extends Usuario {

    @Column(name = "fecha_nacimiento")
    private LocalDate fechaNacimiento;

    @Column(name = "curso", length = 50)
    private String curso;

    @JsonIgnore
    @OneToMany(mappedBy = "alumno", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApoderadoAlumno> apoderadosAsociados = new ArrayList<>();

    public Alumno() {
        super();
    }

    public Alumno(String rut, String primerNombre, String primerApellido, String correo, String passwordHash, LocalDate fechaNacimiento, String curso) {
        super(rut, primerNombre, primerApellido, correo, passwordHash);
        this.fechaNacimiento = fechaNacimiento;
        this.curso = curso;
    }

    @Override
    public String getRol() {
        return "ROLE_ALUMNO";
    }

    public int calcularEdad() {
        if (fechaNacimiento == null) {
            return 0;
        }
        return Period.between(fechaNacimiento, LocalDate.now()).getYears();
    }

    @Override
    public boolean puedeIniciarSesion() {
        return super.puedeIniciarSesion() && calcularEdad() >= 12;
    }

    public boolean puedeReservar() {
        return calcularEdad() >= 12;
    }

    public ApoderadoAlumno asociarApoderado(Apoderado apoderado, Parentesco parentesco) {
        ApoderadoAlumno rel = new ApoderadoAlumno(apoderado, this, parentesco);
        this.apoderadosAsociados.add(rel);
        if (apoderado.getAlumnosAsociados() != null) {
            apoderado.getAlumnosAsociados().add(rel);
        }
        return rel;
    }

    public void desvincularApoderado(Apoderado apoderado) {
        if (apoderado == null || apoderado.getId() == null) return;
        this.apoderadosAsociados.removeIf(rel -> rel.getApoderado() != null && apoderado.getId().equals(rel.getApoderado().getId()));
        if (apoderado.getAlumnosAsociados() != null && this.getId() != null) {
            apoderado.getAlumnosAsociados().removeIf(rel -> rel.getAlumno() != null && this.getId().equals(rel.getAlumno().getId()));
        }
    }

    public void actualizarCurso(String nuevoCurso) {
        this.curso = nuevoCurso;
    }

    public LocalDate getFechaNacimiento() {
        return fechaNacimiento;
    }

    public void setFechaNacimiento(LocalDate fechaNacimiento) {
        this.fechaNacimiento = fechaNacimiento;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public List<ApoderadoAlumno> getApoderadosAsociados() {
        return apoderadosAsociados;
    }

    public void setApoderadosAsociados(List<ApoderadoAlumno> apoderadosAsociados) {
        this.apoderadosAsociados = apoderadosAsociados;
    }
}
