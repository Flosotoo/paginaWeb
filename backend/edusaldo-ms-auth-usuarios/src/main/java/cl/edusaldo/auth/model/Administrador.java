package cl.edusaldo.auth.model;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("ADMINISTRADOR")
public class Administrador extends Usuario {

    public Administrador() {
        super();
    }

    public Administrador(String rut, String primerNombre, String primerApellido, String correo, String passwordHash) {
        super(rut, primerNombre, primerApellido, correo, passwordHash);
    }

    @Override
    public String getRol() {
        return "ROLE_ADMINISTRADOR";
    }
}
