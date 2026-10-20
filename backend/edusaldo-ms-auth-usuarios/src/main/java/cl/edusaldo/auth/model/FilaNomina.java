package cl.edusaldo.auth.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "filas_nomina")
public class FilaNomina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "importacion_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_fila_importacion"))
    private ImportacionNomina importacion;

    @Column(name = "numero_fila", nullable = false)
    private int numeroFila;

    @Column(name = "rut_alumno", length = 20)
    private String rutAlumno;

    @Column(name = "rut_apoderado", length = 20)
    private String rutApoderado;

    @Column(name = "resultado", nullable = false, length = 30)
    private String resultado = "VALIDA";

    @Column(name = "observacion", length = 255)
    private String observacion;

    public FilaNomina() {}

    public FilaNomina(ImportacionNomina importacion, int numeroFila, String rutAlumno, String rutApoderado, String resultado, String observacion) {
        this.importacion = importacion;
        this.numeroFila = numeroFila;
        this.rutAlumno = rutAlumno;
        this.rutApoderado = rutApoderado;
        this.resultado = resultado;
        this.observacion = observacion;
    }

    public void marcarError(String motivo) {
        this.resultado = "ERROR";
        this.observacion = motivo;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ImportacionNomina getImportacion() { return importacion; }
    public void setImportacion(ImportacionNomina importacion) { this.importacion = importacion; }

    public Long getImportacionId() { return importacion != null ? importacion.getId() : null; }

    public int getNumeroFila() { return numeroFila; }
    public void setNumeroFila(int numeroFila) { this.numeroFila = numeroFila; }

    public String getRutAlumno() { return rutAlumno; }
    public void setRutAlumno(String rutAlumno) { this.rutAlumno = rutAlumno; }

    public String getRutApoderado() { return rutApoderado; }
    public void setRutApoderado(String rutApoderado) { this.rutApoderado = rutApoderado; }

    public String getResultado() { return resultado; }
    public void setResultado(String resultado) { this.resultado = resultado; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }
}
