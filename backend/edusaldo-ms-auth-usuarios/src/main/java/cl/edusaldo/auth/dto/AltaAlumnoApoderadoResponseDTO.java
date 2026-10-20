package cl.edusaldo.auth.dto;

public class AltaAlumnoApoderadoResponseDTO {
    private Long alumnoId;
    private Long apoderadoId;
    private String rutAlumno;
    private String nombreAlumno;
    private String rutApoderado;
    private String nombreApoderado;
    private String parentesco;
    private String mensaje;

    public AltaAlumnoApoderadoResponseDTO() {
    }

    public AltaAlumnoApoderadoResponseDTO(Long alumnoId, Long apoderadoId, String rutAlumno, String nombreAlumno,
                                         String rutApoderado, String nombreApoderado, String parentesco, String mensaje) {
        this.alumnoId = alumnoId;
        this.apoderadoId = apoderadoId;
        this.rutAlumno = rutAlumno;
        this.nombreAlumno = nombreAlumno;
        this.rutApoderado = rutApoderado;
        this.nombreApoderado = nombreApoderado;
        this.parentesco = parentesco;
        this.mensaje = mensaje;
    }

    public Long getAlumnoId() { return alumnoId; }
    public void setAlumnoId(Long alumnoId) { this.alumnoId = alumnoId; }
    public Long getApoderadoId() { return apoderadoId; }
    public void setApoderadoId(Long apoderadoId) { this.apoderadoId = apoderadoId; }
    public String getRutAlumno() { return rutAlumno; }
    public void setRutAlumno(String rutAlumno) { this.rutAlumno = rutAlumno; }
    public String getNombreAlumno() { return nombreAlumno; }
    public void setNombreAlumno(String nombreAlumno) { this.nombreAlumno = nombreAlumno; }
    public String getRutApoderado() { return rutApoderado; }
    public void setRutApoderado(String rutApoderado) { this.rutApoderado = rutApoderado; }
    public String getNombreApoderado() { return nombreApoderado; }
    public void setNombreApoderado(String nombreApoderado) { this.nombreApoderado = nombreApoderado; }
    public String getParentesco() { return parentesco; }
    public void setParentesco(String parentesco) { this.parentesco = parentesco; }
    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }
}
