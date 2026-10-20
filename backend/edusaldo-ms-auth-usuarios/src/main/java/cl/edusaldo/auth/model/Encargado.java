package cl.edusaldo.auth.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ENCARGADO")
public class Encargado extends Usuario {

    public Encargado() {
        super();
    }

    public Encargado(String rut, String primerNombre, String primerApellido, String correo, String passwordHash) {
        super(rut, primerNombre, primerApellido, correo, passwordHash);
    }

    @Override
    public String getRol() {
        return "ROLE_ENCARGADO";
    }
}
