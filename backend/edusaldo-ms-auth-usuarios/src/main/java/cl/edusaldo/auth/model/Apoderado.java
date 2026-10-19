package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("APODERADO")
public class Apoderado extends Usuario {

    @Column(name = "telefono", length = 30)
    private String telefono;

    @JsonIgnore
    @OneToMany(mappedBy = "apoderado", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApoderadoAlumno> alumnosAsociados = new ArrayList<>();

    public Apoderado() {
        super();
    }

    public Apoderado(String rut, String primerNombre, String primerApellido, String correo, String passwordHash, String telefono) {
        super(rut, primerNombre, primerApellido, correo, passwordHash);
        this.telefono = telefono;
    }

    @Override
    public String getRol() {
        return "ROLE_APODERADO";
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public List<ApoderadoAlumno> getAlumnosAsociados() {
        return alumnosAsociados;
    }

    public void setAlumnosAsociados(List<ApoderadoAlumno> alumnosAsociados) {
        this.alumnosAsociados = alumnosAsociados;
    }

    public List<Alumno> getAlumnosActivos() {
        List<Alumno> activos = new ArrayList<>();
        if (alumnosAsociados != null) {
            for (ApoderadoAlumno rel : alumnosAsociados) {
                if (rel.getAlumno() != null && rel.getAlumno().getEstado() == EstadoCuenta.ACTIVA) {
                    activos.add(rel.getAlumno());
                }
            }
        }
        return activos;
    }
}
