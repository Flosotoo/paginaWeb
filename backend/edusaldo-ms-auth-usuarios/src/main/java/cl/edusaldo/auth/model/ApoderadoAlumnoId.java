package cl.edusaldo.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ApoderadoAlumnoId implements Serializable {

    @Column(name = "apoderado_id")
    private Long apoderadoId;

    @Column(name = "alumno_id")
    private Long alumnoId;

    public ApoderadoAlumnoId() {
    }

    public ApoderadoAlumnoId(Long apoderadoId, Long alumnoId) {
        this.apoderadoId = apoderadoId;
        this.alumnoId = alumnoId;
    }

    public Long getApoderadoId() {
        return apoderadoId;
    }

    public void setApoderadoId(Long apoderadoId) {
        this.apoderadoId = apoderadoId;
    }

    public Long getAlumnoId() {
        return alumnoId;
    }

    public void setAlumnoId(Long alumnoId) {
        this.alumnoId = alumnoId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ApoderadoAlumnoId that = (ApoderadoAlumnoId) o;
        return Objects.equals(apoderadoId, that.apoderadoId) && Objects.equals(alumnoId, that.alumnoId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(apoderadoId, alumnoId);
    }
}
