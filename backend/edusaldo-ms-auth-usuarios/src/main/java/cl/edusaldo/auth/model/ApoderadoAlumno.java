package cl.edusaldo.auth.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "apoderado_alumnos")
public class ApoderadoAlumno {

    @EmbeddedId
    private ApoderadoAlumnoId id = new ApoderadoAlumnoId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("apoderadoId")
    @JoinColumn(name = "apoderado_id", nullable = false)
    private Apoderado apoderado;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("alumnoId")
    @JoinColumn(name = "alumno_id", nullable = false)
    private Alumno alumno;

    @Enumerated(EnumType.STRING)
    @Column(name = "parentesco", nullable = false, length = 30)
    private Parentesco parentesco;

    @Column(name = "fecha_asociacion", nullable = false)
    private LocalDateTime fechaAsociacion = LocalDateTime.now();

    public ApoderadoAlumno() {
    }

    public ApoderadoAlumno(Apoderado apoderado, Alumno alumno, Parentesco parentesco) {
        this.apoderado = apoderado;
        this.alumno = alumno;
        this.parentesco = parentesco;
        this.fechaAsociacion = LocalDateTime.now();
        Long apoderadoId = apoderado != null ? apoderado.getId() : null;
        Long alumnoId = alumno != null ? alumno.getId() : null;
        this.id = new ApoderadoAlumnoId(apoderadoId, alumnoId);
    }

    public ApoderadoAlumnoId getId() {
        return id;
    }

    public void setId(ApoderadoAlumnoId id) {
        this.id = id;
    }

    public Apoderado getApoderado() {
        return apoderado;
    }

    public void setApoderado(Apoderado apoderado) {
        this.apoderado = apoderado;
        if (apoderado != null && this.id != null) {
            this.id.setApoderadoId(apoderado.getId());
        }
    }

    public Alumno getAlumno() {
        return alumno;
    }

    public void setAlumno(Alumno alumno) {
        this.alumno = alumno;
        if (alumno != null && this.id != null) {
            this.id.setAlumnoId(alumno.getId());
        }
    }

    public Parentesco getParentesco() {
        return parentesco;
    }

    public void setParentesco(Parentesco parentesco) {
        this.parentesco = parentesco;
    }

    public LocalDateTime getFechaAsociacion() {
        return fechaAsociacion;
    }

    public void setFechaAsociacion(LocalDateTime fechaAsociacion) {
        this.fechaAsociacion = fechaAsociacion;
    }
}
